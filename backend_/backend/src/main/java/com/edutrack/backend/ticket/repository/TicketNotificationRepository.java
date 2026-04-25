package com.edutrack.backend.ticket.repository;

import com.edutrack.backend.ticket.entity.TicketNotification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketNotificationRepository extends JpaRepository<TicketNotification, Long> {

    List<TicketNotification> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(String recipientEmail);
}