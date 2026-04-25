package com.edutrack.backend.auth.service;

import com.edutrack.backend.auth.dto.AuthResponse;
import com.edutrack.backend.auth.dto.AdminCreateAccountRequest;
import com.edutrack.backend.auth.dto.AdminUpdateUserRequest;
import com.edutrack.backend.auth.dto.AdminUserDto;
import com.edutrack.backend.auth.dto.ForgotPasswordRequest;
import com.edutrack.backend.auth.dto.LoginRequest;
import com.edutrack.backend.auth.dto.ResetPasswordRequest;
import com.edutrack.backend.auth.dto.SignUpRequest;
import com.edutrack.backend.auth.dto.UpdateOwnProfileRequest;
import com.edutrack.backend.auth.dto.VerifySignUpRequest;
import com.edutrack.backend.auth.config.RoleNames;
import com.edutrack.backend.auth.entity.UserAccount;
import com.edutrack.backend.auth.exception.AuthException;
import com.edutrack.backend.auth.repository.UserAccountRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.oauth2.core.user.OAuth2User;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int OTP_MIN = 1000;
    private static final int OTP_MAX = 9999;
    private static final long OTP_EXPIRY_MINUTES = 10;

    private static final Pattern TECHNICIAN_IT_NUMBER_PATTERN = Pattern.compile("^ITTECH(\\d{3})$");

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String mailFromAddress;
    private final String mailUsername;
    private final String mailPassword;
    private final boolean allowDevOtpFallback;

    private final Map<String, SignupOtpEntry> signupOtps = new ConcurrentHashMap<>();
    private final Map<String, PasswordResetOtpEntry> passwordResetOtps = new ConcurrentHashMap<>();

    public AuthService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.from:no-reply@smartcampus.local}") String mailFromAddress,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${spring.mail.password:}") String mailPassword,
            @Value("${app.mail.allow-dev-otp-fallback:true}") boolean allowDevOtpFallback
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSenderProvider = mailSenderProvider;
        this.mailFromAddress = mailFromAddress;
        this.mailUsername = mailUsername;
        this.mailPassword = mailPassword;
        this.allowDevOtpFallback = allowDevOtpFallback;
    }

    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        String normalizedItNumber = normalizeItNumber(request.itNumber());

        if (!request.password().equals(request.confirmPassword())) {
            throw new AuthException("Passwords do not match");
        }

        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AuthException("An account with this email already exists");
        }

        if (userAccountRepository.existsByItNumberIgnoreCase(normalizedItNumber)) {
            throw new AuthException("An account with this IT number already exists");
        }

        String otpCode = generateOtpCode();
        signupOtps.put(normalizedEmail, new SignupOtpEntry(request, otpCode, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        log.info("Signup OTP generated for {}: {} (expires in {} minutes)", normalizedEmail, otpCode, OTP_EXPIRY_MINUTES);
        try {
            sendEmail(normalizedEmail, "EduTrack signup verification code", buildSignupOtpBody(otpCode, request.fullName().trim()));
        } catch (AuthException mailException) {
            if (allowDevOtpFallback) {
                log.warn("Email send failed for signup OTP. Falling back to API OTP disclosure for {}", normalizedEmail);
                return AuthResponse.messageOnly("Email delivery failed. Use this verification code for now: " + otpCode);
            }
            throw mailException;
        }

        return AuthResponse.messageOnly("A 4-digit verification code has been sent to your email.");
    }

    @Transactional
    public AuthResponse verifySignUpCode(VerifySignUpRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        SignupOtpEntry otpEntry = readValidSignupOtp(normalizedEmail, request.code());
        SignUpRequest signupRequest = otpEntry.request();

        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AuthException("An account with this email already exists");
        }

        String normalizedItNumber = normalizeItNumber(signupRequest.itNumber());
        if (userAccountRepository.existsByItNumberIgnoreCase(normalizedItNumber)) {
            throw new AuthException("An account with this IT number already exists");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setFullName(signupRequest.fullName().trim());
        userAccount.setItNumber(normalizedItNumber);
        userAccount.setEmail(normalizedEmail);
        userAccount.setPasswordHash(passwordEncoder.encode(signupRequest.password()));
        userAccount.setRole(RoleNames.USER);

        UserAccount saved = userAccountRepository.save(userAccount);
        return AuthResponse.success(
                "Signup successful",
                saved.getEmail(),
                saved.getItNumber(),
                saved.getFullName(),
                saved.getRole()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
            throw new AuthException("Invalid email or password");
        }

        String normalizedRole = RoleNames.normalize(userAccount.getRole());

        return AuthResponse.success(
                "Login successful",
                userAccount.getEmail(),
            userAccount.getItNumber(),
                userAccount.getFullName(),
            normalizedRole
        );
    }

    @Transactional
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        boolean accountExists = userAccountRepository.existsByEmailIgnoreCase(normalizedEmail);
        if (!accountExists) {
            return AuthResponse.messageOnly("If the email exists, a 4-digit verification code has been sent.");
        }

        String otpCode = generateOtpCode();
        passwordResetOtps.put(normalizedEmail, new PasswordResetOtpEntry(otpCode, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        log.info("Password reset OTP generated for {}: {} (expires in {} minutes)", normalizedEmail, otpCode, OTP_EXPIRY_MINUTES);
        sendEmail(normalizedEmail, "EduTrack password reset code", buildPasswordResetOtpBody(otpCode));

        return AuthResponse.messageOnly("If the email exists, a 4-digit verification code has been sent.");
    }

    @Transactional
    public AuthResponse verifyPasswordReset(ResetPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new AuthException("Passwords do not match");
        }

        PasswordResetOtpEntry otpEntry = readValidPasswordResetOtp(normalizedEmail, request.code());
        if (otpEntry == null) {
            throw new AuthException("Invalid or expired verification code");
        }

        UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AuthException("Account not found"));

        userAccount.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userAccountRepository.save(userAccount);
        passwordResetOtps.remove(normalizedEmail);

        return AuthResponse.messageOnly("Password reset successful.");
    }

    @Transactional
    public AuthResponse createAccountByAdmin(AdminCreateAccountRequest request) {
        String normalizedRole = request.role().trim().toUpperCase(Locale.ROOT);
        boolean isStudent = "STUDENT".equals(normalizedRole);
        boolean isTechnician = RoleNames.TECHNICIAN.equals(normalizedRole);

        String normalizedItNumber = resolveItNumberForAdminCreate(request.itNumber(), normalizedRole, isStudent, isTechnician);

        String normalizedEmail = resolveEmailForAdminCreate(request, normalizedItNumber, isStudent);
        String resolvedFullName = resolveFullNameForAdminCreate(request, normalizedItNumber, isStudent);
        String resolvedPassword = resolvePasswordForAdminCreate(request, normalizedItNumber, isStudent);

        if (userAccountRepository.existsByItNumberIgnoreCase(normalizedItNumber)) {
            throw new AuthException("An account with this IT number already exists");
        }

        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new AuthException("An account with this email already exists");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setFullName(resolvedFullName);
        userAccount.setItNumber(normalizedItNumber);
        userAccount.setEmail(normalizedEmail);
        userAccount.setPasswordHash(passwordEncoder.encode(resolvedPassword));
        userAccount.setRole(normalizedRole);

        UserAccount saved = userAccountRepository.save(userAccount);

        return AuthResponse.success(
                "Admin account created successfully",
                saved.getEmail(),
                saved.getItNumber(),
                saved.getFullName(),
                saved.getRole()
        );
    }

    private String resolveItNumberForAdminCreate(String itNumber, String normalizedRole, boolean isStudent, boolean isTechnician) {
        if (itNumber != null && !itNumber.isBlank()) {
            String normalizedItNumber = normalizeItNumber(itNumber);
            if (isTechnician) {
                if (!TECHNICIAN_IT_NUMBER_PATTERN.matcher(normalizedItNumber).matches()) {
                    throw new AuthException("Technician IT number must match format ITTECH001");
                }
                return normalizedItNumber;
            }

            if (!normalizedItNumber.matches("^IT\\d{8}$")) {
                throw new AuthException("IT number must match format IT23608054");
            }
            return normalizedItNumber;
        }

        if (isStudent) {
            throw new AuthException("IT number is required for students");
        }

        if (isTechnician) {
            return generateTechnicianItNumber();
        }

        return generateItNumber();
    }

    private String generateTechnicianItNumber() {
        int nextSequence = userAccountRepository.findAll().stream()
                .map(UserAccount::getItNumber)
                .map(TECHNICIAN_IT_NUMBER_PATTERN::matcher)
                .filter(Matcher::matches)
                .mapToInt(matcher -> Integer.parseInt(matcher.group(1)))
                .max()
                .orElse(0) + 1;

        String generatedItNumber;
        do {
            generatedItNumber = String.format("ITTECH%03d", nextSequence++);
        } while (userAccountRepository.existsByItNumberIgnoreCase(generatedItNumber));

        return generatedItNumber;
    }

    private String generateItNumber() {
        String generatedItNumber;
        do {
            generatedItNumber = String.format("IT%08d", ThreadLocalRandom.current().nextInt(100_000_000));
        } while (userAccountRepository.existsByItNumberIgnoreCase(generatedItNumber));

        return generatedItNumber;
    }

    private String resolveEmailForAdminCreate(AdminCreateAccountRequest request, String normalizedItNumber, boolean isStudent) {
        String email = request.email();
        if (email != null && !email.isBlank()) {
            return normalizeEmail(email);
        }

        if (isStudent) {
            return normalizedItNumber.toLowerCase(Locale.ROOT) + "@smartcampus.local";
        }

        throw new AuthException("Email is required for this role");
    }

    private String resolveFullNameForAdminCreate(AdminCreateAccountRequest request, String normalizedItNumber, boolean isStudent) {
        String fullName = request.fullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }

        if (isStudent) {
            return "Student " + normalizedItNumber;
        }

        throw new AuthException("Full name is required for this role");
    }

    private String resolvePasswordForAdminCreate(AdminCreateAccountRequest request, String normalizedItNumber, boolean isStudent) {
        String password = request.password();
        if (password != null && !password.isBlank()) {
            return password;
        }

        if (isStudent) {
            return normalizedItNumber + "@Stu";
        }

        throw new AuthException("Password is required for this role");
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> getAllUsersForAdmin() {
        return userAccountRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AdminUserDto::fromEntity)
                .toList();
    }

    @Transactional
    public AdminUserDto updateUserByAdmin(Long userId, AdminUpdateUserRequest request) {
        UserAccount existingUser = userAccountRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));

        String normalizedEmail = normalizeEmail(request.email());
        String normalizedItNumber = normalizeItNumber(request.itNumber());
        String normalizedRole = request.role().trim().toUpperCase(Locale.ROOT);

        if (userAccountRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, userId)) {
            throw new AuthException("An account with this email already exists");
        }

        if (userAccountRepository.existsByItNumberIgnoreCaseAndIdNot(normalizedItNumber, userId)) {
            throw new AuthException("An account with this IT number already exists");
        }

        existingUser.setFullName(request.fullName().trim());
        existingUser.setEmail(normalizedEmail);
        existingUser.setItNumber(normalizedItNumber);
        existingUser.setRole(normalizedRole);

        UserAccount saved = userAccountRepository.save(existingUser);
        return AdminUserDto.fromEntity(saved);
    }

    @Transactional
    public void deleteUserByAdmin(Long userId) {
        UserAccount existingUser = userAccountRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));
        userAccountRepository.delete(existingUser);
    }

    @Transactional
    public AuthResponse updateOwnProfile(UpdateOwnProfileRequest request) {
        String normalizedCurrentEmail = normalizeEmail(request.currentEmail());
        UserAccount existingUser = userAccountRepository.findByEmailIgnoreCase(normalizedCurrentEmail)
                .orElseThrow(() -> new AuthException("User not found"));

        String normalizedEmail = normalizeEmail(request.email());
        String normalizedItNumber = normalizeItNumber(request.itNumber());

        if (userAccountRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, existingUser.getId())) {
            throw new AuthException("An account with this email already exists");
        }

        if (userAccountRepository.existsByItNumberIgnoreCaseAndIdNot(normalizedItNumber, existingUser.getId())) {
            throw new AuthException("An account with this IT number already exists");
        }

        existingUser.setFullName(request.fullName().trim());
        existingUser.setEmail(normalizedEmail);
        existingUser.setItNumber(normalizedItNumber);

        UserAccount saved = userAccountRepository.save(existingUser);

        return AuthResponse.success(
                "Profile updated successfully",
                saved.getEmail(),
                saved.getItNumber(),
                saved.getFullName(),
                RoleNames.normalize(saved.getRole())
        );
    }

    @Transactional
    public AuthResponse deleteOwnProfile(String email) {
        String normalizedEmail = normalizeEmail(email);
        UserAccount existingUser = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AuthException("User not found"));
        userAccountRepository.delete(existingUser);
        return AuthResponse.messageOnly("Profile deleted successfully");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeItNumber(String itNumber) {
        return itNumber.trim().toUpperCase(Locale.ROOT);
    }

    private String generateOtpCode() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(OTP_MIN, OTP_MAX + 1));
    }

    private void sendEmail(String toAddress, String subject, String body) {
        JavaMailSender javaMailSender = mailSenderProvider.getIfAvailable();
        if (javaMailSender == null) {
            throw new AuthException("Email service is unavailable. Please configure SMTP and try again.");
        }

        if (mailUsername == null || mailUsername.isBlank() || mailPassword == null || mailPassword.isBlank()) {
            throw new AuthException("Email service is not configured. Set MAIL_USERNAME and MAIL_PASSWORD, then retry signup.");
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(mailFromAddress);
            helper.setTo(toAddress);
            helper.setSubject(subject);
            helper.setText(body, false);
            javaMailSender.send(message);
        } catch (MessagingException | MailException ex) {
            log.warn("Failed to send verification email to {}: {}", toAddress, ex.getMessage());
            throw new AuthException("Unable to send verification email. Check SMTP credentials and MAIL_FROM, then try again.");
        }
    }

    private String buildSignupOtpBody(String otpCode, String fullName) {
        return "Hello " + fullName + ",\n\n"
                + "Your EduTrack signup verification code is: " + otpCode + "\n\n"
                + "This code expires in " + OTP_EXPIRY_MINUTES + " minutes.\n"
                + "If you did not request this, you can ignore this email.";
    }

    private String buildPasswordResetOtpBody(String otpCode) {
        return "Your EduTrack password reset code is: " + otpCode + "\n\n"
                + "This code expires in " + OTP_EXPIRY_MINUTES + " minutes.\n"
                + "Use it to confirm your password reset request.";
    }

    private SignupOtpEntry readValidSignupOtp(String normalizedEmail, String code) {
        SignupOtpEntry otpEntry = signupOtps.get(normalizedEmail);
        if (otpEntry == null || otpEntry.expiresAt().isBefore(LocalDateTime.now())) {
            signupOtps.remove(normalizedEmail);
            throw new AuthException("Invalid or expired verification code");
        }

        if (!otpEntry.code().equals(code)) {
            throw new AuthException("Invalid or expired verification code");
        }

        signupOtps.remove(normalizedEmail);
        return otpEntry;
    }

    private PasswordResetOtpEntry readValidPasswordResetOtp(String normalizedEmail, String code) {
        PasswordResetOtpEntry otpEntry = passwordResetOtps.get(normalizedEmail);
        if (otpEntry == null || otpEntry.expiresAt().isBefore(LocalDateTime.now())) {
            passwordResetOtps.remove(normalizedEmail);
            return null;
        }

        if (!otpEntry.code().equals(code)) {
            return null;
        }

        return otpEntry;
    }

    private record SignupOtpEntry(SignUpRequest request, String code, LocalDateTime expiresAt) {
    }

    private record PasswordResetOtpEntry(String code, LocalDateTime expiresAt) {
    }

    

}
