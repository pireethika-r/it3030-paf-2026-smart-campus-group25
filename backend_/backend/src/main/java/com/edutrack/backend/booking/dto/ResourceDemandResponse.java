package com.edutrack.backend.booking.dto;

public record ResourceDemandResponse(
        String resourceName,
        long totalRequests) {
}