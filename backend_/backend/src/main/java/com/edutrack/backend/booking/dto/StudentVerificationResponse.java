package com.edutrack.backend.booking.dto;

public record StudentVerificationResponse(
        String message,
        String fullName,
        String email,
        String itNumber,
        String role) {
}