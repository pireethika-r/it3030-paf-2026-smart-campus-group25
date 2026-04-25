package com.edutrack.backend.booking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(
                @NotBlank(message = "Requester name is required") @Size(max = 120, message = "Requester name must be at most 120 characters") String requesterName,

                @NotBlank(message = "Requester email is required") @Email(message = "Requester email is invalid") @Size(max = 150, message = "Requester email must be at most 150 characters") String requesterEmail,

                @NotBlank(message = "Requester IT number is required") @Size(max = 20, message = "Requester IT number must be at most 20 characters") String requesterItNumber,

                @NotBlank(message = "Resource type is required") @Size(max = 30, message = "Resource type must be at most 30 characters") String resourceType,

                @NotBlank(message = "Resource name is required") @Size(max = 120, message = "Resource name must be at most 120 characters") String resourceName,

                @NotBlank(message = "Purpose is required") @Size(max = 255, message = "Purpose must be at most 255 characters") String purpose,

                @NotNull(message = "Booking date is required") @FutureOrPresent(message = "Booking date must be today or in the future") LocalDate bookingDate,

                @NotNull(message = "Start time is required") LocalTime startTime,

                @NotNull(message = "End time is required") LocalTime endTime,

                @Min(value = 1, message = "Recurrence count must be at least 1") @Max(value = 12, message = "Recurrence count cannot exceed 12") Integer recurrenceCount) {
}
