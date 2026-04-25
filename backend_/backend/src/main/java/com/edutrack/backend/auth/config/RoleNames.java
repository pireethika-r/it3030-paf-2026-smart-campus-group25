package com.edutrack.backend.auth.config;

public final class RoleNames {

    public static final String USER = "USER";
    public static final String ADMIN = "ADMIN";
    public static final String TECHNICIAN = "TECHNICIAN";
    public static final String MANAGER = "MANAGER";

    private RoleNames() {
    }

    public static String normalize(String role) {
        if (role == null || role.isBlank()) {
            return USER;
        }

        String normalized = role.trim().toUpperCase();
        if ("STUDENT".equals(normalized)) {
            return USER;
        }

        return switch (normalized) {
            case USER, ADMIN, TECHNICIAN, MANAGER -> normalized;
            default -> USER;
        };
    }
}