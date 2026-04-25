package com.edutrack.backend.booking.dto;

public record DailyBookingTrendResponse(
        String date,
        long total,
        long pending,
        long approved) {
}