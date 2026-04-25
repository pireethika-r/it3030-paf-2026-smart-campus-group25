package com.edutrack.backend.auth.dto;

public record AuthResponse(
        boolean success,
        String message,
        String email,
        String itNumber,
        String fullName,
        String role
) {

    public static AuthResponse success(String message, String email, String itNumber, String fullName, String role) {
        return new AuthResponse(true, message, email, itNumber, fullName, role);
    }

    public static AuthResponse messageOnly(String message) {
        return new AuthResponse(true, message, null, null, null, null);
    }
}
