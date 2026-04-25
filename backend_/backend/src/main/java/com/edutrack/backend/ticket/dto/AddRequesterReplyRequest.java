package com.edutrack.backend.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddRequesterReplyRequest(
        @NotBlank(message = "Reply message is required") @Size(max = 2000) String replyMessage) {
}