package com.edutrack.backend.ticket.dto;

import jakarta.validation.constraints.Size;

public record UpdateTicketAdminFollowUpRequest(
        Boolean requesterActionRequired,
        @Size(max = 1000) String requestedDocuments,
        @Size(max = 2000) String adminMessage,
        @Size(max = 2000) String relatedDetails) {
}
