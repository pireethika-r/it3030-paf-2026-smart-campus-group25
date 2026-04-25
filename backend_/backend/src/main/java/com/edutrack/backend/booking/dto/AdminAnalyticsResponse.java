package com.edutrack.backend.booking.dto;

import java.util.List;

public record AdminAnalyticsResponse(
        String periodLabel,
        long totalRequests,
        long pendingRequests,
        long approvedRequests,
        long rejectedRequests,
        long cancelledRequests,
        double approvalRate,
        double averageDecisionHours,
        long urgentPendingRequests,
        List<ResourceDemandResponse> topResources,
        List<DailyBookingTrendResponse> weeklyTrend) {
}