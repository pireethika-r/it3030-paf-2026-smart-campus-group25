package com.edutrack.backend.ticket.dto;

import com.edutrack.backend.ticket.enums.TicketCategory;
import com.edutrack.backend.ticket.enums.TicketPriority;
import com.edutrack.backend.ticket.validation.ValidTicketTarget;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@ValidTicketTarget
public record UpdateTicketRequest(
        Long resourceId,
        String location,
        @NotNull TicketCategory category,
        @Size(max = 120) String title,
        @Size(max = 2000) String description,
        TicketPriority priority,
        @NotBlank @Size(max = 120) String preferredContactName,
        @NotBlank @Email @Size(max = 150) String preferredContactEmail,
        @Size(max = 30) String preferredContactPhone) {
}