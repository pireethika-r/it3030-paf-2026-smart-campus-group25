package com.edutrack.backend.auth.config;

import com.edutrack.backend.auth.entity.UserAccount;
import com.edutrack.backend.auth.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

import static com.edutrack.backend.auth.config.RoleNames.ADMIN;
import static com.edutrack.backend.auth.config.RoleNames.MANAGER;
import static com.edutrack.backend.auth.config.RoleNames.TECHNICIAN;

@Component
public class AdminAccountInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@smartcampus.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.full-name:System Admin}")
    private String adminFullName;

    @Value("${app.admin.it-number:ITADMIN01}")
    private String adminItNumber;

    @Value("${app.manager.email:manager@smartcampus.com}")
    private String managerEmail;

    @Value("${app.manager.password:Manager@123}")
    private String managerPassword;

    @Value("${app.manager.full-name:Campus Manager}")
    private String managerFullName;

    @Value("${app.manager.it-number:ITMANAGER1}")
    private String managerItNumber;

    @Value("${app.technician.email:technician@smartcampus.com}")
    private String technicianEmail;

    @Value("${app.technician.password:Tech@123}")
    private String technicianPassword;

    @Value("${app.technician.full-name:Maintenance Technician}")
    private String technicianFullName;

    @Value("${app.technician.it-number:ITTECH001}")
    private String technicianItNumber;

    public AdminAccountInitializer(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAccount(adminEmail, adminPassword, adminFullName, adminItNumber, ADMIN);
        seedAccount(managerEmail, managerPassword, managerFullName, managerItNumber, MANAGER);
        seedAccount(technicianEmail, technicianPassword, technicianFullName, technicianItNumber, TECHNICIAN);
    }

    private void seedAccount(String email, String password, String fullName, String itNumber, String role) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedItNumber = normalizeItNumber(itNumber);

        Optional<UserAccount> accountByEmail = userAccountRepository.findByEmailIgnoreCase(normalizedEmail);
        Optional<UserAccount> accountByItNumber = userAccountRepository.findByItNumberIgnoreCase(normalizedItNumber);

        UserAccount account = accountByEmail.orElseGet(() -> accountByItNumber.orElseGet(UserAccount::new));
        boolean isNewAccount = account.getId() == null;

        account.setFullName(fullName.trim());
        account.setRole(role);

        if (isNewAccount || !passwordEncoder.matches(password, account.getPasswordHash())) {
            account.setPasswordHash(passwordEncoder.encode(password));
        }

        if (isNewAccount || !userAccountRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, account.getId())) {
            account.setEmail(normalizedEmail);
        } else {
            logger.warn("Skipping email update for {} account due to unique conflict: {}", role, normalizedEmail);
        }

        if (isNewAccount || !userAccountRepository.existsByItNumberIgnoreCaseAndIdNot(normalizedItNumber, account.getId())) {
            account.setItNumber(normalizedItNumber);
        } else {
            logger.warn("Skipping IT number update for {} account due to unique conflict: {}", role, normalizedItNumber);
        }

        userAccountRepository.save(account);
        if (isNewAccount) {
            logger.info("Default {} account created for email: {}", role, normalizedEmail);
        } else {
            logger.info("Default {} account updated for email: {}", role, account.getEmail());
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeItNumber(String itNumber) {
        return itNumber.trim().toUpperCase(Locale.ROOT);
    }
}