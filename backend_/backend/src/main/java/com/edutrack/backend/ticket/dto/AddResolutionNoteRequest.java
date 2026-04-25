package com.edutrack.backend.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddResolutionNoteRequest(
        @NotBlank @Size(max = 2000) String resolutionNotes) {
}