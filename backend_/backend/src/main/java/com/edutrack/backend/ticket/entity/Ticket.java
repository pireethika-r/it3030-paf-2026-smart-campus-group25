package com.edutrack.backend.ticket.entity;

import com.edutrack.backend.ticket.enums.TicketCategory;
import com.edutrack.backend.ticket.enums.TicketPriority;
import com.edutrack.backend.ticket.enums.TicketStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tickets")
@Getter
@Setter
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resource_id")
    private Long resourceId;

    @Column(length = 180)
    private String resourceName;

    @Column(length = 180)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketCategory category;

    @Column(length = 120)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketPriority priority;

    @Column(nullable = false, length = 120)
    private String preferredContactName;

    @Column(nullable = false, length = 150)
    private String preferredContactEmail;

    @Column(length = 30)
    private String preferredContactPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketStatus status;

    @Column(length = 2000)
    private String rejectionReason;

    @Column(length = 2000)
    private String resolutionNotes;

    @Column(nullable = false)
    private boolean requesterActionRequired;

    @Column(length = 2000)
    private String requesterReply;

    @Column(length = 1000)
    private String requestedDocuments;

    @Column(length = 2000)
    private String adminMessage;

    @Column(length = 2000)
    private String relatedDetails;

    @Column(length = 150)
    private String createdByEmail;

    @Column(length = 120)
    private String createdByName;

    @Column(length = 30)
    private String createdByRole;

    @Column(length = 150)
    private String assignedTechnicianEmail;

    @Column(length = 120)
    private String assignedTechnicianName;

    @Column(length = 30)
    private String assignedTechnicianRole;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "ticket")
    @OrderBy("uploadedAt ASC")
    private List<TicketAttachment> attachments = new ArrayList<>();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}