package com.edutrack.backend.booking.dto;

import jakarta.validation.constraints.Size;

public record AdminDecisionRequest(
                @Size(max = 255, message = "Admin note must be at most 255 characters") String adminNote) {
}
