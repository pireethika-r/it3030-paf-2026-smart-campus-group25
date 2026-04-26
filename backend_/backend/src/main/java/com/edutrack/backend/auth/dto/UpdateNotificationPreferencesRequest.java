package com.edutrack.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record UpdateNotificationPreferencesRequest(
        String email,
        Map<String, Boolean> preferences
) {}
