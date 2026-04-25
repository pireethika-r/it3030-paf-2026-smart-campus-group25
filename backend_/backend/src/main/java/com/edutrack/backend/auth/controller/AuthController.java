package com.edutrack.backend.auth.controller;

import com.edutrack.backend.auth.dto.AuthResponse;
import com.edutrack.backend.auth.dto.AdminCreateAccountRequest;
import com.edutrack.backend.auth.dto.AdminUpdateUserRequest;
import com.edutrack.backend.auth.dto.AdminUserDto;
import com.edutrack.backend.auth.dto.ForgotPasswordRequest;
import com.edutrack.backend.auth.dto.LoginRequest;
import com.edutrack.backend.auth.dto.ResetPasswordRequest;
import com.edutrack.backend.auth.dto.NotificationPreferencesResponse;
import com.edutrack.backend.auth.dto.SignUpRequest;
import com.edutrack.backend.auth.dto.UpdateOwnProfileRequest;
import com.edutrack.backend.auth.dto.VerifySignUpRequest;
import com.edutrack.backend.auth.dto.UpdateNotificationPreferencesRequest;
import com.edutrack.backend.auth.service.AuthService;
import com.edutrack.backend.auth.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final NotificationPreferenceService notificationPreferenceService;

    public AuthController(AuthService authService, NotificationPreferenceService notificationPreferenceService) {
        this.authService = authService;
        this.notificationPreferenceService = notificationPreferenceService;
    }

    // Signup by validating user details
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        AuthResponse response = authService.signUp(request);
        return ResponseEntity.ok(response);
    }

    // Completes signup after the user submits the email verification code.
    @PostMapping("/signup/verify")
    public ResponseEntity<AuthResponse> verifySignUp(@Valid @RequestBody VerifySignUpRequest request) {
        AuthResponse response = authService.verifySignUpCode(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Authenticates a user with email and password.
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // Sends a password reset code to the provided email address.
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        AuthResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    // Resets the password after validating the submitted reset code.
    @PostMapping("/forgot-password/verify")
    public ResponseEntity<AuthResponse> verifyPasswordReset(@Valid @RequestBody ResetPasswordRequest request) {
        AuthResponse response = authService.verifyPasswordReset(request);
        return ResponseEntity.ok(response);
    }

    // Creates a new user account through admin-only workflow.
    @PostMapping("/admin/users")
    public ResponseEntity<AuthResponse> createAdminAccount(@Valid @RequestBody AdminCreateAccountRequest request) {
        AuthResponse response = authService.createAccountByAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Returns all user accounts for admin management views.
    @GetMapping("/admin/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsersForAdmin());
    }

    // Updates selected user details from the admin management view.
    @PutMapping("/admin/users/{id}")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return ResponseEntity.ok(authService.updateUserByAdmin(id, request));
    }

    // Deletes a user account by id from admin management.
    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        authService.deleteUserByAdmin(id);
        return ResponseEntity.noContent().build();
    }

    // Updates the currently logged-in user's profile details.
    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateOwnProfile(
            @Valid @RequestBody UpdateOwnProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateOwnProfile(request));
    }

    // Deletes the currently logged-in user's profile by email.
    @DeleteMapping("/profile")
    public ResponseEntity<AuthResponse> deleteOwnProfile(@RequestParam String email) {
        return ResponseEntity.ok(authService.deleteOwnProfile(email));
    }

    // Fetches saved notification preferences for a given user email.
    @GetMapping("/notification-preferences")
    public ResponseEntity<NotificationPreferencesResponse> getNotificationPreferences(
            @RequestParam String email
    ) {
        return ResponseEntity.ok(notificationPreferenceService.getPreferencesByEmail(email));
    }

    // Persists notification preference changes for a user.
    @PutMapping("/notification-preferences")
    public ResponseEntity<NotificationPreferencesResponse> updateNotificationPreferences(
            @Valid @RequestBody UpdateNotificationPreferencesRequest request
    ) {
        return ResponseEntity.ok(notificationPreferenceService.updatePreferences(request));
    }

    // Lists supported notification categories for client preference.
    @GetMapping("/notification-preferences/categories")
    public ResponseEntity<List<String>> getNotificationCategories() {
        return ResponseEntity.ok(notificationPreferenceService.getSupportedCategories());
    }
}
