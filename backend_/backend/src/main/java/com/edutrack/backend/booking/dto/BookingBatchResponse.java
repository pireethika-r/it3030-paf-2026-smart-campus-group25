package com.edutrack.backend.booking.dto;

import java.util.List;

public record BookingBatchResponse(
        String message,
        List<BookingResponse> bookings) {
}
