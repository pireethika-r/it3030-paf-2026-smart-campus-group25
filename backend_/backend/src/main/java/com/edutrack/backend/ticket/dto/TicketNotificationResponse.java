package com.edutrack.backend.ticket.dto;

import com.edutrack.backend.ticket.entity.TicketNotification;
import java.time.LocalDateTime;

public record TicketNotificationResponse(
        Long id,
        Long ticketId,
        String title,
        String message,
        String recipientEmail,
        boolean read,
        LocalDateTime createdAt) {

    public static TicketNotificationResponse from(TicketNotification notification) {
        return new TicketNotificationResponse(
                notification.getId(),
                notification.getTicketId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getRecipientEmail(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}