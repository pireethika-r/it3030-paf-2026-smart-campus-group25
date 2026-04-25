package com.edutrack.backend.ticket.dto;

import com.edutrack.backend.ticket.enums.TicketStatus;
import jakarta.validation.constraints.Size;

public record UpdateTicketStatusRequest(
        TicketStatus status,
        @Size(max = 2000) String rejectionReason) {
}