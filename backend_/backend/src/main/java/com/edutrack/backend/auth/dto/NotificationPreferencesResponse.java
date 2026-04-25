package com.edutrack.backend.auth.dto;

import java.util.Map;

public record NotificationPreferencesResponse(
        String email,
        Map<String, Boolean> preferences
) {
}
