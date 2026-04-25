package com.edutrack.backend.ticket.dto;

import com.edutrack.backend.ticket.entity.TicketAttachment;
import java.time.LocalDateTime;

public record TicketAttachmentResponse(
        Long id,
        String originalFileName,
        String contentType,
        Long sizeBytes,
        String downloadUrl,
        LocalDateTime uploadedAt) {

    public static TicketAttachmentResponse from(TicketAttachment attachment) {
        return new TicketAttachmentResponse(
                attachment.getId(),
                attachment.getOriginalFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                "/api/tickets/attachments/" + attachment.getId(),
                attachment.getUploadedAt());
    }
}