package com.edutrack.backend.ticket.dto;

import com.edutrack.backend.ticket.entity.Ticket;
import com.edutrack.backend.ticket.entity.TicketAttachment;
import com.edutrack.backend.ticket.enums.TicketCategory;
import com.edutrack.backend.ticket.enums.TicketPriority;
import com.edutrack.backend.ticket.enums.TicketStatus;
import java.time.LocalDateTime;
import java.util.List;

public record TicketResponse(
        Long id,
        Long resourceId,
        String resourceName,
        String location,
        TicketCategory category,
        String title,
        String description,
        TicketPriority priority,
        String preferredContactName,
        String preferredContactEmail,
        String preferredContactPhone,
        TicketStatus status,
        String rejectionReason,
        String resolutionNotes,
        boolean requesterActionRequired,
        String requesterReply,
        String requestedDocuments,
        String adminMessage,
        String relatedDetails,
        String createdByEmail,
        String createdByName,
        String createdByRole,
        String assignedTechnicianEmail,
        String assignedTechnicianName,
        String assignedTechnicianRole,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<TicketAttachmentResponse> attachments,
        boolean editableByCurrentUser,
        boolean manageableByCurrentUser) {

    public static TicketResponse from(
            Ticket ticket,
            List<TicketAttachment> attachmentEntities,
            String requesterEmail,
            String requesterRole) {
        boolean isOwner = requesterEmail != null && requesterEmail.equalsIgnoreCase(ticket.getCreatedByEmail());
        boolean isAssigned = requesterEmail != null && requesterEmail.equalsIgnoreCase(ticket.getAssignedTechnicianEmail());
        boolean isAdmin = requesterRole != null && requesterRole.equalsIgnoreCase("ADMIN");
        boolean isStaff = isAssigned || isAdmin || (requesterRole != null && requesterRole.equalsIgnoreCase("TECHNICIAN"));

        List<TicketAttachmentResponse> attachments = attachmentEntities.stream()
                .map(TicketAttachmentResponse::from)
                .toList();

        return new TicketResponse(
                ticket.getId(),
                ticket.getResourceId(),
                ticket.getResourceName(),
                ticket.getLocation(),
                ticket.getCategory(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getPreferredContactName(),
                ticket.getPreferredContactEmail(),
                ticket.getPreferredContactPhone(),
                ticket.getStatus(),
                ticket.getRejectionReason(),
                ticket.getResolutionNotes(),
                ticket.isRequesterActionRequired(),
                ticket.getRequesterReply(),
                ticket.getRequestedDocuments(),
                ticket.getAdminMessage(),
                ticket.getRelatedDetails(),
                ticket.getCreatedByEmail(),
                ticket.getCreatedByName(),
                ticket.getCreatedByRole(),
                ticket.getAssignedTechnicianEmail(),
                ticket.getAssignedTechnicianName(),
                ticket.getAssignedTechnicianRole(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                attachments,
                isOwner || isAdmin,
                isStaff || isAdmin);
    }
}