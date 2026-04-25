package com.edutrack.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifySignUpRequest(
        @NotBlank(message = "Email is required")
        @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email must be a valid email address")
        String email,

        @NotBlank(message = "Verification code is required")
        @Pattern(regexp = "^\\d{4}$", message = "Verification code must be 4 digits")
        String code
) {
}