package com.edutrack.backend.ticket.repository;

import com.edutrack.backend.ticket.entity.TicketAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
    List<TicketAttachment> findByTicketIdOrderByUploadedAtAsc(Long ticketId);

    long countByTicketId(Long ticketId);
}