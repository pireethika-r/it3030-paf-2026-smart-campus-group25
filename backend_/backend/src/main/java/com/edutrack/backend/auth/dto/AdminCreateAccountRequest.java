package com.edutrack.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminCreateAccountRequest(
        @Size(min = 3, max = 120, message = "Full name must be between 3 and 120 characters")
        String fullName,

        String itNumber,

        @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email must be a valid email address")
        String email,

        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?\":{}|<>]).{8,}$",
                message = "Password must be at least 8 characters with uppercase, lowercase, and a number or symbol"
        )
        String password,

        @NotBlank(message = "Role is required")
        @Pattern(regexp = "^(ADMIN|MANAGER|TECHNICIAN|USER|STUDENT)$", message = "Role must be ADMIN, MANAGER, TECHNICIAN, USER, or STUDENT")
        String role
) {
}