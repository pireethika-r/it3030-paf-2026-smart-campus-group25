package com.edutrack.backend.booking.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateBookingRequest(
                @NotBlank(message = "Resource type is required") @Size(max = 30, message = "Resource type must be at most 30 characters") String resourceType,

                @NotBlank(message = "Resource name is required") @Size(max = 120, message = "Resource name must be at most 120 characters") String resourceName,

                @NotBlank(message = "Purpose is required") @Size(max = 255, message = "Purpose must be at most 255 characters") String purpose,

                @NotNull(message = "Booking date is required") @FutureOrPresent(message = "Booking date must be today or in the future") LocalDate bookingDate,

                @NotNull(message = "Start time is required") LocalTime startTime,

                @NotNull(message = "End time is required") LocalTime endTime) {
}
