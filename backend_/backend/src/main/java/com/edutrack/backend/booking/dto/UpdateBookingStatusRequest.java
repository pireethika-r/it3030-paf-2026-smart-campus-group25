package com.edutrack.backend.booking.dto;

import com.edutrack.backend.booking.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateBookingStatusRequest(
        @NotNull(message = "Status is required") BookingStatus status,

        @Size(max = 255, message = "Admin note must be at most 255 characters") String adminNote) {
}
