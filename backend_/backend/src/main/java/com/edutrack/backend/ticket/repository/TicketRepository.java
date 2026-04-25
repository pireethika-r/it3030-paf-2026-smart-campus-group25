package com.edutrack.backend.ticket.repository;

import com.edutrack.backend.ticket.entity.Ticket;
import com.edutrack.backend.ticket.enums.TicketStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCreatedByEmailIgnoreCaseOrderByCreatedAtDesc(String createdByEmail);

    List<Ticket> findByStatusOrderByUpdatedAtDesc(TicketStatus status);

    List<Ticket> findByAssignedTechnicianEmailIgnoreCaseOrderByUpdatedAtDesc(String assignedTechnicianEmail);

    List<Ticket> findAllByOrderByUpdatedAtDesc();
}