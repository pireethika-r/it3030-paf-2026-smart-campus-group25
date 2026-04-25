package com.edutrack.backend.ticket.dto;

public record TicketSummaryResponse(
        long total,
        long open,
        long inProgress,
        long resolved,
        long closed,
        long rejected) {
}