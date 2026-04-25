package com.edutrack.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record UpdateNotificationPreferencesRequest(
        @NotBlank(message = "Email is required")
        String email,

        @NotNull(message = "Preferences map is required")
        Map<String, Boolean> preferences
) {
}
