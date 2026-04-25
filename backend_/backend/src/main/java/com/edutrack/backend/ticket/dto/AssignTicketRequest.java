package com.edutrack.backend.ticket.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AssignTicketRequest(
        @NotBlank @Email String technicianEmail) {
}