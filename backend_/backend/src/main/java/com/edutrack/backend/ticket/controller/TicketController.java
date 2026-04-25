package com.edutrack.backend.ticket.controller;

import com.edutrack.backend.ticket.dto.AddResolutionNoteRequest;
import com.edutrack.backend.ticket.dto.AddRequesterReplyRequest;
import com.edutrack.backend.ticket.dto.AssignTicketRequest;
import com.edutrack.backend.ticket.dto.CreateTicketRequest;
import com.edutrack.backend.ticket.dto.TicketNotificationResponse;
import com.edutrack.backend.ticket.dto.TicketResponse;
import com.edutrack.backend.ticket.dto.UpdateTicketAdminFollowUpRequest;
import com.edutrack.backend.ticket.dto.UpdateTicketRequest;
import com.edutrack.backend.ticket.dto.UpdateTicketStatusRequest;
import com.edutrack.backend.ticket.entity.TicketAttachment;
import com.edutrack.backend.ticket.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    // Exposes the ticket endpoints used by both requester and admin flows.
    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Name") String actorName,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(request, actorEmail, actorName, actorRole));
    }

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.getMyTickets(actorEmail, actorRole));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets(
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.getAllTickets(actorEmail, actorRole));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<TicketNotificationResponse>> getNotifications(
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.getNotifications(actorEmail, actorRole));
    }

    @PatchMapping("/notifications/{notificationId}/read")
    public ResponseEntity<TicketNotificationResponse> markNotificationAsRead(
            @PathVariable Long notificationId,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.markNotificationAsRead(notificationId, actorEmail, actorRole));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.getTicketById(id, actorEmail, actorRole));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketRequest request,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request, actorEmail, actorRole));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<TicketResponse> cancelTicket(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.cancelTicket(id, actorEmail, actorRole));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, request, actorEmail, actorRole));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.updateStatus(id, request, actorEmail, actorRole));
    }

    @PatchMapping("/{id}/resolution-notes")
    public ResponseEntity<TicketResponse> addResolutionNotes(
            @PathVariable Long id,
            @Valid @RequestBody AddResolutionNoteRequest request,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.addResolutionNotes(id, request, actorEmail, actorRole));
    }

    @PatchMapping("/{id}/requester-reply")
    public ResponseEntity<TicketResponse> addRequesterReply(
            @PathVariable Long id,
            @Valid @RequestBody AddRequesterReplyRequest request,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.addRequesterReply(id, request, actorEmail, actorRole));
    }

    @PatchMapping("/{id}/admin-follow-up")
    public ResponseEntity<TicketResponse> updateAdminFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketAdminFollowUpRequest request,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.updateAdminFollowUp(id, request, actorEmail, actorRole));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponse> uploadAttachments(
            @PathVariable Long id,
            @RequestPart("files") List<MultipartFile> files,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Name") String actorName,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.uploadAttachments(id, files, actorEmail, actorName, actorRole));
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<ByteArrayResource> downloadAttachment(@PathVariable Long attachmentId) {
        TicketAttachment attachment = ticketService.getAttachment(attachmentId);
        byte[] content = ticketService.readAttachmentBytes(attachmentId);

        // Fall back to a safe binary type if the stored content type is missing or invalid.
        MediaType safeMediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (attachment.getContentType() != null && !attachment.getContentType().isBlank()) {
                safeMediaType = MediaType.parseMediaType(attachment.getContentType());
            }
        } catch (IllegalArgumentException ignored) {
            safeMediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        String safeFileName = attachment.getOriginalFileName() == null || attachment.getOriginalFileName().isBlank()
                ? "attachment"
                : attachment.getOriginalFileName();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(safeFileName).build().toString())
                .contentType(safeMediaType)
                .body(new ByteArrayResource(content));
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<TicketResponse> deleteAttachment(
            @PathVariable Long attachmentId,
            @RequestHeader("X-User-Email") String actorEmail,
            @RequestHeader("X-User-Role") String actorRole) {
        return ResponseEntity.ok(ticketService.deleteAttachment(attachmentId, actorEmail, actorRole));
    }
}
