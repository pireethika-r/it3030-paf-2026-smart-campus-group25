package com.edutrack.backend.booking.service;

import com.edutrack.backend.booking.dto.AdminDecisionRequest;
import com.edutrack.backend.booking.dto.AdminAnalyticsResponse;
import com.edutrack.backend.booking.dto.BookingBatchResponse;
import com.edutrack.backend.booking.dto.BookingResponse;
import com.edutrack.backend.booking.dto.BookingSummaryResponse;
import com.edutrack.backend.booking.dto.CreateBookingRequest;
import com.edutrack.backend.booking.dto.DailyBookingTrendResponse;
import com.edutrack.backend.booking.dto.ResourceDemandResponse;
import com.edutrack.backend.booking.dto.StudentVerificationResponse;
import com.edutrack.backend.booking.dto.UpdateBookingRequest;
import com.edutrack.backend.auth.entity.UserAccount;
import com.edutrack.backend.auth.repository.UserAccountRepository;
import com.edutrack.backend.booking.entity.Booking;
import com.edutrack.backend.booking.enums.BookingStatus;
import com.edutrack.backend.booking.exception.BookingException;
import com.edutrack.backend.booking.repository.BookingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
            BookingStatus.PENDING,
            BookingStatus.APPROVED);
    private static final LocalTime BUSINESS_DAY_END = LocalTime.of(22, 0);

    private final BookingRepository bookingRepository;
    private final UserAccountRepository userAccountRepository;

    public BookingService(BookingRepository bookingRepository, UserAccountRepository userAccountRepository) {
        this.bookingRepository = bookingRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public BookingBatchResponse createBooking(CreateBookingRequest request) {
        validateTimeRange(request.startTime(), request.endTime());

        UserAccount student = findActiveStudentOrThrow(
                request.requesterName(),
                request.requesterEmail(),
                request.requesterItNumber());

        int recurrenceCount = request.recurrenceCount() == null ? 1 : request.recurrenceCount();
        String recurrenceGroupId = recurrenceCount > 1 ? UUID.randomUUID().toString() : null;

        List<BookingResponse> createdBookings = new ArrayList<>();
        for (int i = 0; i < recurrenceCount; i++) {
            LocalDate targetDate = request.bookingDate().plusWeeks(i);
            ensureNoOverlap(
                    request.resourceName().trim(),
                    targetDate,
                    request.startTime(),
                    request.endTime(),
                    null);

            Booking booking = new Booking();
            booking.setRequesterName(student.getFullName().trim());
            booking.setRequesterEmail(student.getEmail());
            booking.setRequesterItNumber(student.getItNumber());
            booking.setResourceType(request.resourceType().trim());
            booking.setResourceName(request.resourceName().trim());
            booking.setPurpose(request.purpose().trim());
            booking.setBookingDate(targetDate);
            booking.setStartTime(request.startTime());
            booking.setEndTime(request.endTime());
            booking.setStatus(BookingStatus.PENDING);
            booking.setRecurrenceGroupId(recurrenceGroupId);
            booking.setRecurrenceIndex(recurrenceCount > 1 ? i + 1 : null);

            Booking saved = bookingRepository.save(booking);
            createdBookings.add(BookingResponse.from(saved));
        }

        String message = recurrenceCount > 1
                ? "Recurring booking requests submitted successfully"
                : "Booking request submitted successfully";
        return new BookingBatchResponse(message, createdBookings);
    }

    @Transactional(readOnly = true)
    public StudentVerificationResponse verifyStudentForAdmin(
            String requesterName,
            String requesterEmail,
            String requesterItNumber) {
        UserAccount student = findActiveStudentOrThrow(requesterName, requesterEmail, requesterItNumber);
        return new StudentVerificationResponse(
                "Student verified successfully",
                student.getFullName().trim(),
                student.getEmail(),
                student.getItNumber(),
                student.getRole());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String requesterEmail) {
        String normalizedEmail = normalizeEmail(requesterEmail);
        return bookingRepository.findByRequesterEmailIgnoreCaseOrderByBookingDateAscStartTimeAsc(normalizedEmail)
                .stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyUpcomingBookings(String requesterEmail, int days) {
        String normalizedEmail = normalizeEmail(requesterEmail);
        int clampedDays = Math.max(1, Math.min(days, 60));
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(clampedDays);

        return bookingRepository
                .findByRequesterEmailIgnoreCaseAndStatusInAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                        normalizedEmail,
                        ACTIVE_BOOKING_STATUSES,
                        from,
                        to)
                .stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingSummaryResponse getMyBookingSummary(String requesterEmail) {
        String normalizedEmail = normalizeEmail(requesterEmail);
        List<Booking> bookings = bookingRepository
                .findByRequesterEmailIgnoreCaseOrderByBookingDateAscStartTimeAsc(normalizedEmail);

        long total = bookings.size();
        long pending = bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.PENDING).count();
        long approved = bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.APPROVED).count();
        long rejected = bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.REJECTED).count();
        long cancelled = bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.CANCELLED).count();
        long checkedIn = bookings.stream().filter(Booking::isCheckedIn).count();

        LocalDate today = LocalDate.now();
        long upcoming = bookingRepository
                .findByRequesterEmailIgnoreCaseAndStatusInAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                        normalizedEmail,
                        ACTIVE_BOOKING_STATUSES,
                        today,
                        today.plusDays(14))
                .size();

        Booking next = bookingRepository
                .findTopByRequesterEmailIgnoreCaseAndBookingDateGreaterThanEqualOrderByBookingDateAscStartTimeAsc(
                        normalizedEmail,
                        today);

        String peakHour = bookings.isEmpty()
                ? null
                : bookings.stream()
                        .collect(Collectors.groupingBy(booking -> booking.getStartTime().getHour(),
                                Collectors.counting()))
                        .entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(entry -> String.format("%02d:00", entry.getKey()))
                        .orElse(null);

        String mostUsedResource = bookings.isEmpty()
                ? null
                : bookings.stream()
                        .collect(Collectors.groupingBy(Booking::getResourceName, Collectors.counting()))
                        .entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(null);

        return new BookingSummaryResponse(
                total,
                pending,
                approved,
                rejected,
                cancelled,
                checkedIn,
                upcoming,
                next == null ? null : next.getBookingDate(),
                peakHour,
                mostUsedResource);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookings(BookingStatus status) {
        List<Booking> bookings = status == null
                ? bookingRepository.findAllByOrderByBookingDateAscStartTimeAsc()
                : bookingRepository.findByStatusOrderByBookingDateAscStartTimeAsc(status);

        return bookings.stream().map(this::toBookingResponseWithInsight).toList();
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAdminAnalytics() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        List<Booking> monthlyBookings = bookingRepository
                .findByBookingDateBetweenOrderByBookingDateAscStartTimeAsc(monthStart, monthEnd);

        long totalRequests = monthlyBookings.size();
        long pendingRequests = monthlyBookings.stream().filter(booking -> booking.getStatus() == BookingStatus.PENDING)
                .count();
        long approvedRequests = monthlyBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.APPROVED)
                .count();
        long rejectedRequests = monthlyBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.REJECTED)
                .count();
        long cancelledRequests = monthlyBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CANCELLED)
                .count();

        double approvalRate = totalRequests == 0 ? 0.0 : (approvedRequests * 100.0) / totalRequests;

        List<Booking> decidedBookings = monthlyBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.APPROVED
                        || booking.getStatus() == BookingStatus.REJECTED)
                .filter(booking -> booking.getCreatedAt() != null && booking.getUpdatedAt() != null)
                .toList();

        double averageDecisionHours = decidedBookings.isEmpty()
                ? 0.0
                : decidedBookings.stream()
                        .mapToLong(booking -> Math.max(0,
                                ChronoUnit.MINUTES.between(booking.getCreatedAt(), booking.getUpdatedAt())))
                        .average()
                        .orElse(0.0) / 60.0;

        long urgentPendingRequests = bookingRepository.findAllByOrderByBookingDateAscStartTimeAsc().stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PENDING)
                .filter(booking -> !booking.getBookingDate().isBefore(today)
                        && !booking.getBookingDate().isAfter(today.plusDays(1)))
                .count();

        List<ResourceDemandResponse> topResources = monthlyBookings.stream()
                .collect(Collectors.groupingBy(Booking::getResourceName, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new ResourceDemandResponse(entry.getKey(), entry.getValue()))
                .toList();

        Map<LocalDate, List<Booking>> weeklyByDate = bookingRepository
                .findByBookingDateBetweenOrderByBookingDateAscStartTimeAsc(today.minusDays(6), today)
                .stream()
                .collect(Collectors.groupingBy(Booking::getBookingDate));

        List<DailyBookingTrendResponse> weeklyTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            List<Booking> dayBookings = weeklyByDate.getOrDefault(day, List.of());
            long dayPending = dayBookings.stream().filter(booking -> booking.getStatus() == BookingStatus.PENDING)
                    .count();
            long dayApproved = dayBookings.stream().filter(booking -> booking.getStatus() == BookingStatus.APPROVED)
                    .count();

            weeklyTrend.add(new DailyBookingTrendResponse(
                    day.toString(),
                    dayBookings.size(),
                    dayPending,
                    dayApproved));
        }

        String periodLabel = monthStart + " to " + monthEnd;

        return new AdminAnalyticsResponse(
                periodLabel,
                totalRequests,
                pendingRequests,
                approvedRequests,
                rejectedRequests,
                cancelledRequests,
                round2(approvalRate),
                round2(averageDecisionHours),
                urgentPendingRequests,
                topResources,
                weeklyTrend);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getCalendarBookings(LocalDate from, LocalDate to, String requesterEmail) {
        LocalDate rangeStart = from == null ? LocalDate.now().minusDays(7) : from;
        LocalDate rangeEnd = to == null ? LocalDate.now().plusDays(30) : to;

        List<Booking> bookings;
        if (requesterEmail != null && !requesterEmail.isBlank()) {
            bookings = bookingRepository
                    .findByRequesterEmailIgnoreCaseAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                            normalizeEmail(requesterEmail),
                            rangeStart,
                            rangeEnd);
        } else {
            bookings = bookingRepository.findByBookingDateBetweenOrderByBookingDateAscStartTimeAsc(rangeStart,
                    rangeEnd);
        }

        return bookings.stream().map(BookingResponse::from).toList();
    }

    @Transactional
    public BookingResponse updateBooking(Long id, String requesterEmail, UpdateBookingRequest request) {
        Booking booking = findBookingOrThrow(id);
        verifyOwnership(booking, requesterEmail);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingException("Only pending bookings can be updated", HttpStatus.CONFLICT);
        }

        validateTimeRange(request.startTime(), request.endTime());
        ensureNoOverlap(
                request.resourceName().trim(),
                request.bookingDate(),
                request.startTime(),
                request.endTime(),
                booking.getId());

        booking.setResourceType(request.resourceType().trim());
        booking.setResourceName(request.resourceName().trim());
        booking.setPurpose(request.purpose().trim());
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.from(saved);
    }

    @Transactional
    public BookingResponse approveBooking(Long id, AdminDecisionRequest request) {
        Booking booking = findBookingOrThrow(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingException("Only pending bookings can be approved", HttpStatus.CONFLICT);
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminNote(trimToNull(request.adminNote(), "Approved by admin"));
        booking.setQrToken(UUID.randomUUID().toString());
        booking.setCheckedIn(false);
        booking.setCheckedInAt(null);

        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse rejectBooking(Long id, AdminDecisionRequest request) {
        Booking booking = findBookingOrThrow(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingException("Only pending bookings can be rejected", HttpStatus.CONFLICT);
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminNote(trimToNull(request.adminNote(), "Rejected by admin"));
        booking.setQrToken(null);
        booking.setCheckedIn(false);
        booking.setCheckedInAt(null);

        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse checkIn(Long id, String token) {
        Booking booking = findBookingOrThrow(id);

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BookingException("Only approved bookings can be checked in", HttpStatus.CONFLICT);
        }

        if (booking.isCheckedIn()) {
            throw new BookingException("Booking is already checked in", HttpStatus.CONFLICT);
        }

        if (booking.getQrToken() == null || !booking.getQrToken().equals(token)) {
            throw new BookingException("Invalid QR token", HttpStatus.UNAUTHORIZED);
        }

        booking.setCheckedIn(true);
        booking.setCheckedInAt(LocalDateTime.now());
        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse cancelBooking(Long id, String requesterEmail) {
        Booking booking = findBookingOrThrow(id);
        verifyOwnership(booking, requesterEmail);

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new BookingException("Only pending or approved bookings can be cancelled", HttpStatus.CONFLICT);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setAdminNote("Cancelled by requester");
        booking.setQrToken(null);
        booking.setCheckedIn(false);
        booking.setCheckedInAt(null);

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.from(saved);
    }

    @Transactional
    public void deleteBooking(Long id, String requesterEmail) {
        Booking booking = findBookingOrThrow(id);
        verifyOwnership(booking, requesterEmail);

        if (booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.APPROVED) {
            throw new BookingException("Active bookings cannot be deleted. Cancel it first.", HttpStatus.CONFLICT);
        }

        bookingRepository.delete(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        return toBookingResponseWithInsight(findBookingOrThrow(id));
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingByQrToken(String token) {
        if (token == null || token.trim().isBlank()) {
            throw new BookingException("QR token is required", HttpStatus.BAD_REQUEST);
        }

        Booking booking = bookingRepository.findByQrToken(token.trim())
                .orElseThrow(() -> new BookingException("Invalid or expired QR token", HttpStatus.NOT_FOUND));

        return BookingResponse.from(booking);
    }

    private BookingResponse toBookingResponseWithInsight(Booking booking) {
        int score = 10;
        List<String> reasons = new ArrayList<>();
        LocalDate today = LocalDate.now();

        if (booking.getStatus() == BookingStatus.PENDING) {
            score += 18;
            reasons.add("Awaiting admin decision");
        }

        long daysUntil = ChronoUnit.DAYS.between(today, booking.getBookingDate());
        if (booking.getStatus() == BookingStatus.PENDING && daysUntil < 0) {
            score += 25;
            reasons.add("Pending request is already in the past");
        } else if (daysUntil <= 1) {
            score += 18;
            reasons.add("Booking is within next 24 hours");
        } else if (daysUntil <= 3) {
            score += 10;
            reasons.add("Near-term booking window");
        }

        int hour = booking.getStartTime().getHour();
        if (hour >= 10 && hour <= 14) {
            score += 8;
            reasons.add("Peak utilization time slot");
        }

        long activeSameResource = bookingRepository.countByResourceNameIgnoreCaseAndBookingDateAndStatusIn(
                booking.getResourceName(),
                booking.getBookingDate(),
                ACTIVE_BOOKING_STATUSES);

        if (activeSameResource >= 5) {
            score += 20;
            reasons.add("Heavy demand for this resource/date");
        } else if (activeSameResource >= 3) {
            score += 12;
            reasons.add("Moderate demand for this resource/date");
        }

        long requesterTotal = bookingRepository.countByRequesterEmailIgnoreCase(booking.getRequesterEmail());
        long requesterCancelled = bookingRepository.countByRequesterEmailIgnoreCaseAndStatus(
                booking.getRequesterEmail(),
                BookingStatus.CANCELLED);

        if (requesterTotal >= 4) {
            double cancelRate = requesterCancelled / (double) requesterTotal;
            if (cancelRate >= 0.5) {
                score += 15;
                reasons.add("Requester has high cancellation history");
            } else if (cancelRate >= 0.3) {
                score += 8;
                reasons.add("Requester has moderate cancellation history");
            }
        }

        if (booking.getCreatedAt() != null) {
            LocalDateTime bookingStart = booking.getBookingDate().atTime(booking.getStartTime());
            long leadHours = ChronoUnit.HOURS.between(booking.getCreatedAt(), bookingStart);
            if (leadHours <= 24) {
                score += 10;
                reasons.add("Short notice request");
            }
        }

        int finalScore = Math.max(0, Math.min(score, 100));
        String level = finalScore >= 70 ? "HIGH" : finalScore >= 40 ? "MEDIUM" : "LOW";
        String recommendedAction;
        if (booking.getStatus() != BookingStatus.PENDING) {
            recommendedAction = "MONITOR";
        } else if ("LOW".equals(level)) {
            recommendedAction = "APPROVE";
        } else {
            recommendedAction = "REVIEW";
        }

        if (reasons.isEmpty()) {
            reasons.add("No exceptional risk signals");
        }

        List<String> topReasons = reasons.stream()
                .sorted(Comparator.naturalOrder())
                .limit(4)
                .toList();

        return BookingResponse.from(booking, finalScore, level, recommendedAction, topReasons);
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private void ensureNoOverlap(
            String resourceName,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            Long excludeBookingId) {
        boolean overlap = excludeBookingId == null
                ? bookingRepository.existsOverlappingBooking(
                        resourceName,
                        bookingDate,
                        startTime,
                        endTime,
                        ACTIVE_BOOKING_STATUSES)
                : bookingRepository.existsOverlappingBookingExcludingId(
                        resourceName,
                        bookingDate,
                        startTime,
                        endTime,
                        ACTIVE_BOOKING_STATUSES,
                        excludeBookingId);

        if (overlap) {
            List<String> suggestions = suggestAlternativeSlots(resourceName, bookingDate, startTime, endTime);
            throw new BookingException(
                    "Selected slot overlaps with an existing booking",
                    HttpStatus.CONFLICT,
                    suggestions);
        }
    }

    private List<String> suggestAlternativeSlots(
            String resourceName,
            LocalDate bookingDate,
            LocalTime requestedStart,
            LocalTime requestedEnd) {
        long durationMinutes = Math.max(30, ChronoUnit.MINUTES.between(requestedStart, requestedEnd));
        LocalTime candidateStart = requestedEnd;
        List<String> suggestions = new ArrayList<>();

        while (suggestions.size() < 3) {
            LocalTime candidateEnd = candidateStart.plusMinutes(durationMinutes);
            if (candidateEnd.isAfter(BUSINESS_DAY_END)) {
                break;
            }

            boolean hasConflict = bookingRepository.existsOverlappingBooking(
                    resourceName,
                    bookingDate,
                    candidateStart,
                    candidateEnd,
                    ACTIVE_BOOKING_STATUSES);

            if (!hasConflict) {
                suggestions.add(candidateStart + " - " + candidateEnd);
            }

            candidateStart = candidateStart.plusMinutes(30);
        }

        if (suggestions.isEmpty()) {
            suggestions.add("Try another time or another resource");
        }
        return suggestions;
    }

    private void verifyOwnership(Booking booking, String requesterEmail) {
        String normalized = normalizeEmail(requesterEmail);
        if (!booking.getRequesterEmail().equalsIgnoreCase(normalized)) {
            throw new BookingException("You can only modify your own booking", HttpStatus.FORBIDDEN);
        }
    }

    private Booking findBookingOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BookingException("Booking not found"));
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BookingException("Start time must be before end time");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeItNumber(String itNumber) {
        return itNumber.trim().toUpperCase(Locale.ROOT);
    }

    private UserAccount findActiveStudentOrThrow(String requesterName, String requesterEmail,
            String requesterItNumber) {
        String normalizedName = requesterName.trim();
        String normalizedEmail = normalizeEmail(requesterEmail);
        String normalizedItNumber = normalizeItNumber(requesterItNumber);

        UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BookingException("Student not found in the database", HttpStatus.NOT_FOUND));

        if (!userAccount.getFullName().trim().equalsIgnoreCase(normalizedName)) {
            throw new BookingException("Student name does not match the database record", HttpStatus.CONFLICT);
        }

        if (!userAccount.getItNumber().equalsIgnoreCase(normalizedItNumber)) {
            throw new BookingException("Student email and IT number do not match", HttpStatus.CONFLICT);
        }

        if (userAccount.getRole() == null) {
            throw new BookingException("Only student accounts can be booked by admin", HttpStatus.FORBIDDEN);
        }

        String normalizedRole = userAccount.getRole().trim().toUpperCase(Locale.ROOT);
        if (!"STUDENT".equals(normalizedRole) && !"USER".equals(normalizedRole)) {
            throw new BookingException("Only student accounts can be booked by admin", HttpStatus.FORBIDDEN);
        }

        return userAccount;
    }

    private String trimToNull(String value, String fallback) {
        if (value == null || value.trim().isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
