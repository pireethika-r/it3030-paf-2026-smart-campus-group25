package com.edutrack.backend.ticket.service;

import com.edutrack.backend.auth.config.RoleNames;
import com.edutrack.backend.auth.entity.UserAccount;
import com.edutrack.backend.auth.repository.UserAccountRepository;
import com.edutrack.backend.resource.entity.Resource;
import com.edutrack.backend.resource.repository.ResourceRepository;
import com.edutrack.backend.ticket.dto.AddResolutionNoteRequest;
import com.edutrack.backend.ticket.dto.AddRequesterReplyRequest;
import com.edutrack.backend.ticket.dto.AssignTicketRequest;
import com.edutrack.backend.ticket.dto.CreateTicketRequest;
import com.edutrack.backend.ticket.dto.TicketNotificationResponse;
import com.edutrack.backend.ticket.dto.TicketResponse;
import com.edutrack.backend.ticket.dto.UpdateTicketAdminFollowUpRequest;
import com.edutrack.backend.ticket.dto.UpdateTicketRequest;
import com.edutrack.backend.ticket.dto.UpdateTicketStatusRequest;
import com.edutrack.backend.ticket.entity.Ticket;
import com.edutrack.backend.ticket.entity.TicketAttachment;
import com.edutrack.backend.ticket.entity.TicketNotification;
import com.edutrack.backend.ticket.enums.TicketCategory;
import com.edutrack.backend.ticket.enums.TicketPriority;
import com.edutrack.backend.ticket.enums.TicketStatus;
import com.edutrack.backend.ticket.exception.TicketException;
import com.edutrack.backend.ticket.repository.TicketAttachmentRepository;
import com.edutrack.backend.ticket.repository.TicketRepository;
import com.edutrack.backend.ticket.repository.TicketNotificationRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketService {

    // Allowed next states for the main ticket workflow.
    private static final List<TicketStatus> OPEN_TRANSITIONS = List.of(TicketStatus.IN_PROGRESS, TicketStatus.AWAITING_FOR_REPLY, TicketStatus.REJECTED);
    private static final List<TicketStatus> IN_PROGRESS_TRANSITIONS = List.of(TicketStatus.AWAITING_FOR_REPLY, TicketStatus.RESOLVED, TicketStatus.OPEN);
    private static final List<TicketStatus> AWAITING_REPLY_TRANSITIONS = List.of(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.REJECTED);
    private static final List<TicketStatus> RESOLVED_TRANSITIONS = List.of(TicketStatus.CLOSED, TicketStatus.IN_PROGRESS, TicketStatus.AWAITING_FOR_REPLY);

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketNotificationRepository ticketNotificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final ResourceRepository resourceRepository;
    private final Path uploadRoot;

    public TicketService(
            TicketRepository ticketRepository,
            TicketAttachmentRepository ticketAttachmentRepository,
            TicketNotificationRepository ticketNotificationRepository,
            UserAccountRepository userAccountRepository,
            ResourceRepository resourceRepository,
            @Value("${app.ticket.upload-dir:uploads/tickets}") String uploadDir) {
        this.ticketRepository = ticketRepository;
        this.ticketAttachmentRepository = ticketAttachmentRepository;
        this.ticketNotificationRepository = ticketNotificationRepository;
        this.userAccountRepository = userAccountRepository;
        this.resourceRepository = resourceRepository;
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String actorEmail, String actorName, String actorRole) {
        validateActor(actorEmail, actorName, actorRole);

        // Create a fresh ticket record from the incoming request.
        Ticket ticket = new Ticket();
        applyRequestFields(
            ticket,
            request.resourceId(),
            request.location(),
            request.category(),
            request.title(),
            request.description(),
            request.priority(),
            request.preferredContactName(),
            request.preferredContactEmail(),
            request.preferredContactPhone());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedByEmail(normalizeEmail(actorEmail));
        ticket.setCreatedByName(actorName.trim());
        ticket.setCreatedByRole(RoleNames.normalize(actorRole));

        Ticket saved = ticketRepository.save(ticket);
        notifyAdminsOnTicketCreated(saved);
        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional
    public TicketResponse updateTicket(Long id, UpdateTicketRequest request, String actorEmail, String actorRole) {
        Ticket ticket = getTicketEntity(id);
        ensureEditableByOwnerOrAdmin(ticket, actorEmail, actorRole);
        ensureTicketNotFinal(ticket);

        applyRequestFields(
                ticket,
                request.resourceId(),
                request.location(),
                request.category(),
                request.title(),
                request.description(),
                request.priority(),
                request.preferredContactName(),
                request.preferredContactEmail(),
                request.preferredContactPhone());
        Ticket saved = ticketRepository.save(ticket);
        if (isStaffOrAdmin(actorRole)) {
            notifyOwner(saved, "Ticket details updated", "Admin/staff updated your ticket details.", actorEmail);
        }
        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional
    public TicketResponse cancelTicket(Long id, String actorEmail, String actorRole) {
        Ticket ticket = getTicketEntity(id);
        ensureEditableByOwnerOrAdmin(ticket, actorEmail, actorRole);
        ensureTicketNotFinal(ticket);

        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason("Cancelled by requester");
        if (ticket.getResolutionNotes() == null || ticket.getResolutionNotes().isBlank()) {
            ticket.setResolutionNotes("Ticket cancelled by requester.");
        }

        Ticket saved = ticketRepository.save(ticket);
        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(String email, String role) {
        String normalizedEmail = normalizeEmail(email);
        return ticketRepository.findByCreatedByEmailIgnoreCaseOrderByCreatedAtDesc(normalizedEmail)
                .stream()
                .map(ticket -> toResponse(ticket, email, role))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets(String email, String role) {
        ensureStaffOrAdmin(role);
        return ticketRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(ticket -> toResponse(ticket, email, role))
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id, String email, String role) {
        Ticket ticket = getTicketEntity(id);
        ensureCanView(ticket, email, role);
        return toResponse(ticket, email, role);
    }

    @Transactional
    public TicketResponse assignTechnician(Long id, AssignTicketRequest request, String actorEmail, String actorRole) {
        ensureAdmin(actorRole);
        Ticket ticket = getTicketEntity(id);
        UserAccount technician = findAssignableUser(request.technicianEmail());

        ticket.setAssignedTechnicianEmail(technician.getEmail());
        ticket.setAssignedTechnicianName(technician.getFullName());
        ticket.setAssignedTechnicianRole(technician.getRole());

        Ticket saved = ticketRepository.save(ticket);
        notifyOwner(saved, "Ticket assigned", "Admin assigned your ticket to " + technician.getFullName() + ".", actorEmail);
        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional
    public TicketResponse updateStatus(Long id, UpdateTicketStatusRequest request, String actorEmail, String actorRole) {
        Ticket ticket = getTicketEntity(id);
        ensureCanMutateStatus(ticket, actorEmail, actorRole);

        TicketStatus currentStatus = ticket.getStatus();
        TicketStatus nextStatus = request.status();
        validateTransition(currentStatus, nextStatus);

        ticket.setStatus(nextStatus);
        if (nextStatus == TicketStatus.REJECTED) {
            if (request.rejectionReason() == null || request.rejectionReason().isBlank()) {
                throw new TicketException(HttpStatus.BAD_REQUEST, "Rejection reason is required when rejecting a ticket");
            }
            ticket.setRejectionReason(request.rejectionReason().trim());
        } else if (nextStatus != TicketStatus.REJECTED) {
            ticket.setRejectionReason(null);
        }

        Ticket saved = ticketRepository.save(ticket);
        notifyOwner(saved, "Ticket status updated", "Admin/staff changed ticket status to " + nextStatus + ".", actorEmail);
        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional
    public TicketResponse addResolutionNotes(Long id, AddResolutionNoteRequest request, String actorEmail, String actorRole) {
        Ticket ticket = getTicketEntity(id);
        ensureAssignedStaffOrAdmin(ticket, actorEmail, actorRole);

        if (ticket.getStatus() == TicketStatus.AWAITING_FOR_REPLY && (request.resolutionNotes() == null || request.resolutionNotes().isBlank())) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Resolution notes are required when ticket status is Awaiting for reply");
        }

        ticket.setResolutionNotes(request.resolutionNotes().trim());
        if (ticket.getStatus() == TicketStatus.AWAITING_FOR_REPLY) {
            // Start a fresh requester reply cycle for each new admin note.
            ticket.setRequesterReply(null);
            ticket.setRequesterActionRequired(true);
        }
        Ticket saved = ticketRepository.save(ticket);

        if (saved.getStatus() == TicketStatus.AWAITING_FOR_REPLY) {
            notifyOwner(saved, "Action required on your ticket", "Admin requested a response: " + saved.getResolutionNotes(), actorEmail);
        } else {
            notifyOwner(saved, "Resolution notes updated", "Admin updated resolution notes on your ticket.", actorEmail);
        }

        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional
    public TicketResponse addRequesterReply(Long id, AddRequesterReplyRequest request, String actorEmail, String actorRole) {
        Ticket ticket = getTicketEntity(id);
        ensureEditableByOwnerOrAdmin(ticket, actorEmail, actorRole);
        ensureTicketNotFinal(ticket);

        if (ticket.getStatus() != TicketStatus.AWAITING_FOR_REPLY) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Requester replies are only allowed when ticket status is Awaiting for reply");
        }

        ticket.setRequesterReply(request.replyMessage().trim());
        ticket.setRequesterActionRequired(false);

        Ticket saved = ticketRepository.save(ticket);
        notifyAdminsOnRequesterReply(saved, actorEmail);
        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional(readOnly = true)
    public List<TicketNotificationResponse> getNotifications(String actorEmail, String actorRole) {
        if (actorEmail == null || actorEmail.isBlank()) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Actor email is required");
        }

        return ticketNotificationRepository.findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(normalizeEmail(actorEmail))
                .stream()
                .map(TicketNotificationResponse::from)
                .toList();
    }

    @Transactional
    public TicketNotificationResponse markNotificationAsRead(Long notificationId, String actorEmail, String actorRole) {
        TicketNotification notification = ticketNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new TicketException(HttpStatus.NOT_FOUND, "Notification not found"));

        String normalizedEmail = normalizeEmail(actorEmail);
        if (!normalizedEmail.equalsIgnoreCase(notification.getRecipientEmail())) {
            throw new TicketException(HttpStatus.FORBIDDEN, "You do not have access to this notification");
        }

        notification.setRead(true);
        TicketNotification saved = ticketNotificationRepository.save(notification);
        return TicketNotificationResponse.from(saved);
    }

    @Transactional
    public TicketResponse updateAdminFollowUp(Long id, UpdateTicketAdminFollowUpRequest request, String actorEmail, String actorRole) {
        ensureStaffOrAdmin(actorRole);
        Ticket ticket = getTicketEntity(id);
        ensureCanView(ticket, actorEmail, actorRole);
        ensureTicketNotFinal(ticket);

        ticket.setRequesterActionRequired(Boolean.TRUE.equals(request.requesterActionRequired()));
        ticket.setRequestedDocuments(trimToNull(request.requestedDocuments()));
        ticket.setAdminMessage(trimToNull(request.adminMessage()));
        ticket.setRelatedDetails(trimToNull(request.relatedDetails()));

        Ticket saved = ticketRepository.save(ticket);

        if (saved.isRequesterActionRequired() && saved.getAdminMessage() != null && !saved.getAdminMessage().isBlank()) {
            notifyOwner(saved, "Action required on your ticket", "Admin requested: " + saved.getAdminMessage(), actorEmail);
        } else {
            notifyOwner(saved, "Ticket follow-up updated", "Admin/staff updated ticket follow-up details.", actorEmail);
        }

        return toResponse(saved, actorEmail, actorRole);
    }

    @Transactional
    public TicketResponse uploadAttachments(Long id, List<MultipartFile> files, String actorEmail, String actorName, String actorRole) {
        Ticket ticket = getTicketEntity(id);
        ensureCanView(ticket, actorEmail, actorRole);

        if (files == null || files.isEmpty()) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "At least one image file is required");
        }

        long existingCount = ticketAttachmentRepository.countByTicketId(ticket.getId());
        if (existingCount + files.size() > 3) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "A ticket can have at most 3 attachments");
        }

        try {
            Files.createDirectories(uploadRoot);
            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    continue;
                }

                // Accept common support evidence formats only.
                String contentType = file.getContentType();
                String normalizedContentType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
                boolean isImage = normalizedContentType.startsWith("image/");
                boolean isPdf = "application/pdf".equals(normalizedContentType);
                if (!isImage && !isPdf) {
                    throw new TicketException(HttpStatus.BAD_REQUEST, "Only image or PDF attachments are allowed");
                }

                String storedFileName = UUID.randomUUID() + "-" + sanitizeFileName(Objects.requireNonNullElse(file.getOriginalFilename(), "attachment"));
                Path targetPath = uploadRoot.resolve(storedFileName).normalize();
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                TicketAttachment attachment = new TicketAttachment();
                attachment.setTicket(ticket);
                attachment.setOriginalFileName(file.getOriginalFilename());
                attachment.setStoredFileName(storedFileName);
                attachment.setContentType(contentType);
                attachment.setSizeBytes(file.getSize());
                attachment.setFilePath(targetPath.toString());
                attachment.setUploadedByEmail(normalizeEmail(actorEmail));
                attachment.setUploadedByName(actorName.trim());
                ticketAttachmentRepository.save(attachment);
            }
        } catch (Exception ex) {
            throw new TicketException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store ticket attachment");
        }

        return toResponse(ticket, actorEmail, actorRole);
    }

    @Transactional(readOnly = true)
    public TicketAttachment getAttachment(Long attachmentId) {
        return ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new TicketException(HttpStatus.NOT_FOUND, "Attachment not found"));
    }

    @Transactional(readOnly = true)
    public byte[] readAttachmentBytes(Long attachmentId) {
        TicketAttachment attachment = getAttachment(attachmentId);
        try {
            return Files.readAllBytes(Path.of(attachment.getFilePath()));
        } catch (Exception ex) {
            throw new TicketException(HttpStatus.NOT_FOUND, "Attachment file not available");
        }
    }

    @Transactional
    public TicketResponse deleteAttachment(Long attachmentId, String actorEmail, String actorRole) {
        TicketAttachment attachment = getAttachment(attachmentId);
        Ticket ticket = attachment.getTicket();

        ensureEditableByOwnerOrAdmin(ticket, actorEmail, actorRole);
        ensureTicketNotFinal(ticket);

        try {
            Files.deleteIfExists(Path.of(attachment.getFilePath()));
        } catch (Exception ex) {
            throw new TicketException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to remove attachment file");
        }

        ticketAttachmentRepository.delete(attachment);
        return toResponse(ticket, actorEmail, actorRole);
    }

    private void applyRequestFields(Ticket ticket,
            Long resourceId,
            String location,
            TicketCategory category,
            String title,
            String description,
            TicketPriority priority,
            String preferredContactName,
            String preferredContactEmail,
            String preferredContactPhone) {
        // Copy validated request values onto the ticket entity.
        ticket.setResourceId(resourceId);
        if (resourceId != null) {
            Resource resource = resourceRepository.findById(resourceId)
                    .orElseThrow(() -> new TicketException(HttpStatus.NOT_FOUND, "Resource not found with id: " + resourceId));
            ticket.setResourceName(resource.getName());
        } else {
            ticket.setResourceName(null);
        }

        if (category == TicketCategory.OTHER && (title == null || title.isBlank())) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Title is required when category is OTHER");
        }

        ticket.setLocation(location == null ? null : location.trim());
        ticket.setCategory(category);
        ticket.setTitle(title == null || title.isBlank() ? null : title.trim());
        ticket.setDescription(description == null || description.isBlank() ? null : description.trim());
        ticket.setPriority(priority == null ? TicketPriority.MEDIUM : priority);
        ticket.setPreferredContactName(preferredContactName.trim());
        ticket.setPreferredContactEmail(normalizeEmail(preferredContactEmail));
        ticket.setPreferredContactPhone(preferredContactPhone == null || preferredContactPhone.isBlank() ? null : preferredContactPhone.trim());
    }

    private Ticket getTicketEntity(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new TicketException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    private TicketResponse toResponse(Ticket ticket, String requesterEmail, String requesterRole) {
        List<TicketAttachment> attachments = ticketAttachmentRepository.findByTicketIdOrderByUploadedAtAsc(ticket.getId());
        return TicketResponse.from(ticket, attachments, requesterEmail, requesterRole);
    }

    private void validateTransition(TicketStatus currentStatus, TicketStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return;
        }

        // Keep ticket status changes inside the supported workflow.
        boolean valid = switch (currentStatus) {
            case OPEN -> OPEN_TRANSITIONS.contains(nextStatus);
            case IN_PROGRESS -> IN_PROGRESS_TRANSITIONS.contains(nextStatus);
            case AWAITING_FOR_REPLY -> AWAITING_REPLY_TRANSITIONS.contains(nextStatus);
            case RESOLVED -> RESOLVED_TRANSITIONS.contains(nextStatus);
            case CLOSED, REJECTED -> false;
        };

        if (!valid) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Invalid ticket status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private void ensureTicketNotFinal(Ticket ticket) {
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.REJECTED) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Closed or rejected tickets cannot be edited");
        }
    }

    private void ensureEditableByOwnerOrAdmin(Ticket ticket, String actorEmail, String actorRole) {
        boolean isOwner = actorEmail != null && actorEmail.equalsIgnoreCase(ticket.getCreatedByEmail());
        if (!isOwner && !isAdmin(actorRole)) {
            throw new TicketException(HttpStatus.FORBIDDEN, "Only the ticket owner or admin can update this ticket");
        }
    }

    private void ensureCanView(Ticket ticket, String actorEmail, String actorRole) {
        boolean isOwner = actorEmail != null && actorEmail.equalsIgnoreCase(ticket.getCreatedByEmail());
        boolean isAssigned = actorEmail != null && actorEmail.equalsIgnoreCase(ticket.getAssignedTechnicianEmail());
        if (!isOwner && !isAssigned && !isStaffOrAdmin(actorRole)) {
            throw new TicketException(HttpStatus.FORBIDDEN, "You do not have access to this ticket");
        }
    }

    private void ensureCanMutateStatus(Ticket ticket, String actorEmail, String actorRole) {
        if (isAdmin(actorRole)) {
            return;
        }

        boolean isAssigned = actorEmail != null && actorEmail.equalsIgnoreCase(ticket.getAssignedTechnicianEmail());
        if (!isAssigned || !isStaffOrAdmin(actorRole)) {
            throw new TicketException(HttpStatus.FORBIDDEN, "Only the assigned technician or admin can update status");
        }
    }

    private void ensureAssignedStaffOrAdmin(Ticket ticket, String actorEmail, String actorRole) {
        if (isAdmin(actorRole)) {
            return;
        }

        boolean isAssigned = actorEmail != null && actorEmail.equalsIgnoreCase(ticket.getAssignedTechnicianEmail());
        if (!isAssigned) {
            throw new TicketException(HttpStatus.FORBIDDEN, "Only the assigned technician or admin can update resolution notes");
        }
    }

    private void ensureAdmin(String role) {
        if (!isAdmin(role)) {
            throw new TicketException(HttpStatus.FORBIDDEN, "Admin role required for this action");
        }
    }

    private void ensureStaffOrAdmin(String role) {
        if (!isStaffOrAdmin(role)) {
            throw new TicketException(HttpStatus.FORBIDDEN, "Technician or admin role required for this action");
        }
    }

    private boolean isStaffOrAdmin(String role) {
        String normalized = RoleNames.normalize(role);
        return RoleNames.ADMIN.equals(normalized) || RoleNames.TECHNICIAN.equals(normalized) || "MANAGER".equals(normalized);
    }

    private boolean isAdmin(String role) {
        return RoleNames.ADMIN.equals(RoleNames.normalize(role));
    }

    private UserAccount findAssignableUser(String email) {
        String normalizedEmail = normalizeEmail(email);
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new TicketException(HttpStatus.NOT_FOUND, "Assignable user not found"));

        String role = RoleNames.normalize(user.getRole());
        if (!RoleNames.TECHNICIAN.equals(role) && !RoleNames.ADMIN.equals(role) && !"MANAGER".equals(role)) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Assigned user must be a technician or staff member");
        }

        return user;
    }

    private void validateActor(String actorEmail, String actorName, String actorRole) {
        if (actorEmail == null || actorEmail.isBlank()) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Actor email is required");
        }
        if (actorName == null || actorName.isBlank()) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Actor name is required");
        }
        if (actorRole == null || actorRole.isBlank()) {
            throw new TicketException(HttpStatus.BAD_REQUEST, "Actor role is required");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String sanitizeFileName(String originalFileName) {
        return originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private void notifyAdminsOnTicketCreated(Ticket ticket) {
        List<UserAccount> admins = userAccountRepository.findByRoleIgnoreCase(RoleNames.ADMIN);
        for (UserAccount admin : admins) {
            createNotification(
                    ticket.getId(),
                    admin.getEmail(),
                    "New ticket raised",
                    "Ticket #" + ticket.getId() + " was raised by " + ticket.getCreatedByName() + ".");
        }
    }

    private void notifyAdminsOnRequesterReply(Ticket ticket, String actorEmail) {
        List<UserAccount> admins = userAccountRepository.findByRoleIgnoreCase(RoleNames.ADMIN);
        for (UserAccount admin : admins) {
            if (admin.getEmail() != null && actorEmail != null && admin.getEmail().equalsIgnoreCase(actorEmail)) {
                continue;
            }
            createNotification(
                    ticket.getId(),
                    admin.getEmail(),
                    "Requester replied",
                    "Ticket #" + ticket.getId() + " has a new requester reply.");
        }
    }

    private void notifyOwner(Ticket ticket, String title, String detail, String actorEmail) {
        if (ticket.getCreatedByEmail() == null || ticket.getCreatedByEmail().isBlank()) {
            return;
        }

        if (actorEmail != null && actorEmail.equalsIgnoreCase(ticket.getCreatedByEmail())) {
            return;
        }

        createNotification(ticket.getId(), ticket.getCreatedByEmail(), title, detail);
    }

    private void createNotification(Long ticketId, String recipientEmail, String title, String detail) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return;
        }

        TicketNotification notification = new TicketNotification();
        notification.setTicketId(ticketId);
        notification.setRecipientEmail(normalizeEmail(recipientEmail));
        notification.setTitle(title);
        notification.setMessage(detail);
        notification.setRead(false);
        ticketNotificationRepository.save(notification);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
