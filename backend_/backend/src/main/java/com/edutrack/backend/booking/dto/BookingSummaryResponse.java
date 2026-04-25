package com.edutrack.backend.booking.dto;

import java.time.LocalDate;

public record BookingSummaryResponse(
        long total,
        long pending,
        long approved,
        long rejected,
        long cancelled,
        long checkedIn,
        long upcoming,
        LocalDate nextBookingDate,
        String peakHour,
        String mostUsedResource) {
}