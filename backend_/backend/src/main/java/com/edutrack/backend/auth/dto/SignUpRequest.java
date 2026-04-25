package com.edutrack.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 3, max = 120, message = "Full name must be between 3 and 120 characters")
        String fullName,

        @NotBlank(message = "IT number is required")
        @Pattern(regexp = "^IT\\d{8}$", message = "IT number must match format IT23608054")
        String itNumber,

        @NotBlank(message = "Email is required")
        @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?\":{}|<>]).{8,}$",
                message = "Password must be at least 8 characters with uppercase, lowercase, and a number or symbol"
        )
        String password,

        @NotBlank(message = "Confirm password is required")
        String confirmPassword
) {
}
