package com.edutrack.backend.booking.controller;

import com.edutrack.backend.booking.dto.AdminDecisionRequest;
import com.edutrack.backend.booking.dto.AdminAnalyticsResponse;
import com.edutrack.backend.booking.dto.BookingBatchResponse;
import com.edutrack.backend.booking.dto.BookingResponse;
import com.edutrack.backend.booking.dto.BookingSummaryResponse;
import com.edutrack.backend.booking.dto.CreateBookingRequest;
import com.edutrack.backend.booking.dto.StudentVerificationResponse;
import com.edutrack.backend.booking.dto.UpdateBookingRequest;
import com.edutrack.backend.booking.enums.BookingStatus;
import com.edutrack.backend.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingBatchResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingBatchResponse response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify-student")
    public ResponseEntity<StudentVerificationResponse> verifyStudentForAdmin(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String itNumber) {
        StudentVerificationResponse response = bookingService.verifyStudentForAdmin(name, email, itNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@RequestParam String email) {
        return ResponseEntity.ok(bookingService.getMyBookings(email));
    }

    @GetMapping("/my/upcoming")
    public ResponseEntity<List<BookingResponse>> getMyUpcomingBookings(
            @RequestParam String email,
            @RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(bookingService.getMyUpcomingBookings(email, days));
    }

    @GetMapping("/my/summary")
    public ResponseEntity<BookingSummaryResponse> getMyBookingSummary(@RequestParam String email) {
        return ResponseEntity.ok(bookingService.getMyBookingSummary(email));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getBookings(
            @RequestParam(required = false) BookingStatus status) {
        List<BookingResponse> bookings = bookingService.getBookings(status);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/admin/analytics")
    public ResponseEntity<AdminAnalyticsResponse> getAdminAnalytics() {
        return ResponseEntity.ok(bookingService.getAdminAnalytics());
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<BookingResponse>> getCalendarBookings(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(bookingService.getCalendarBookings(from, to, email));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        BookingResponse booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/qr/{token}")
    public ResponseEntity<BookingResponse> getBookingByQrToken(@PathVariable String token) {
        BookingResponse booking = bookingService.getBookingByQrToken(token);
        return ResponseEntity.ok(booking);
    }

    @GetMapping(value = "/qr-view/{token}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getBookingQrView(@PathVariable String token) {
        BookingResponse booking = bookingService.getBookingByQrToken(token);
        String safeTitle = escapeHtml("Booking #" + booking.id());
        String safeRequesterName = escapeHtml(booking.requesterName());
        String safeRequesterEmail = escapeHtml(booking.requesterEmail());
        String safeRequesterItNumber = escapeHtml(booking.requesterItNumber());
        String safeResourceType = escapeHtml(booking.resourceType());
        String safeResourceName = escapeHtml(booking.resourceName());
        String safeDate = escapeHtml(String.valueOf(booking.bookingDate()));
        String safeStart = escapeHtml(String.valueOf(booking.startTime()));
        String safeEnd = escapeHtml(String.valueOf(booking.endTime()));
        String safePurpose = escapeHtml(booking.purpose());
        String safeStatus = escapeHtml(String.valueOf(booking.status()));
        String safeCheckedIn = booking.checkedIn() ? "Yes" : "No";
        String safeCheckedInAt = booking.checkedInAt() == null ? "Not yet"
                : escapeHtml(String.valueOf(booking.checkedInAt()));

        String html = """
                <!doctype html>
                <html>
                    <head>
                        <meta charset=\"utf-8\" />
                        <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
                        <title>%s</title>
                        <style>
                            :root {
                                --navy: #1e3a8a;
                                --blue: #2563eb;
                                --orange: #f59e0b;
                                --slate: #0f172a;
                                --line: #dbe3ef;
                            }
                            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            body { margin: 0; padding: 18px; font-family: Segoe UI, Arial, sans-serif; background: #f1f5f9; color: var(--slate); }
                            .sheet { max-width: 860px; margin: 0 auto; border: 1px solid #dbe3ef; border-radius: 16px; overflow: hidden; background: #fff; }
                            .header {
                                padding: 16px;
                                color: #fff;
                                background: linear-gradient(115deg, var(--navy) 0%%, var(--blue) 56%%, var(--orange) 100%%);
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                gap: 12px;
                            }
                            .header h1 { margin: 0; font-size: 22px; }
                            .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.95; }
                            .pill { background: #fff; color: #1f2937; border-radius: 999px; padding: 8px 12px; font-size: 11px; font-weight: 800; }
                            .content { padding: 16px; }
                            .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
                            .card { border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
                            .card h2 { margin: 0 0 8px; font-size: 14px; color: #0f172a; }
                            .kv { display: grid; grid-template-columns: 120px 1fr; gap: 6px; margin: 6px 0; }
                            .k { font-size: 12px; color: #475569; font-weight: 700; }
                            .v { font-size: 13px; color: #0f172a; font-weight: 700; word-break: break-word; }
                            .actions { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
                            .btn {
                                border: 0;
                                border-radius: 10px;
                                padding: 10px 14px;
                                font-size: 12px;
                                font-weight: 800;
                                cursor: pointer;
                            }
                            .btn-primary { background: #1d4ed8; color: #fff; }
                            .btn-light { background: #e2e8f0; color: #0f172a; }
                            .footer { margin-top: 12px; border-top: 1px dashed #94a3b8; padding-top: 10px; font-size: 11px; color: #475569; }
                            @media (min-width: 720px) {
                                .grid { grid-template-columns: 1fr 1fr; }
                            }
                            @media print {
                                body { background: #fff; padding: 0; }
                                .sheet { border: 0; border-radius: 0; }
                                .actions { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class=\"sheet\">
                            <div class=\"header\">
                                <div>
                                    <h1>EduTrack Booking Details</h1>
                                    <p>Cross-device QR verification page</p>
                                </div>
                                <div class=\"pill\">STATUS: %s</div>
                            </div>
                            <div class=\"content\">
                                <div class=\"grid\">
                                    <div class=\"card\">
                                        <h2>Student</h2>
                                        <div class=\"kv\"><div class=\"k\">Name</div><div class=\"v\">%s</div></div>
                                        <div class=\"kv\"><div class=\"k\">Email</div><div class=\"v\">%s</div></div>
                                        <div class=\"kv\"><div class=\"k\">IT Number</div><div class=\"v\">%s</div></div>
                                    </div>
                                    <div class=\"card\">
                                        <h2>Booking</h2>
                                        <div class=\"kv\"><div class=\"k\">Booking ID</div><div class=\"v\">%s</div></div>
                                        <div class=\"kv\"><div class=\"k\">Resource</div><div class=\"v\">%s - %s</div></div>
                                        <div class=\"kv\"><div class=\"k\">Date</div><div class=\"v\">%s</div></div>
                                        <div class=\"kv\"><div class=\"k\">Time</div><div class=\"v\">%s - %s</div></div>
                                    </div>
                                </div>
                                <div class=\"card\" style=\"margin-top:12px;\">
                                    <h2>Purpose</h2>
                                    <div class=\"v\">%s</div>
                                </div>
                                <div class=\"card\" style=\"margin-top:12px;\">
                                    <h2>Check-in</h2>
                                    <div class=\"kv\"><div class=\"k\">Checked In</div><div class=\"v\">%s</div></div>
                                    <div class=\"kv\"><div class=\"k\">Checked In At</div><div class=\"v\">%s</div></div>
                                </div>
                                <div class=\"actions\">
                                    <button class=\"btn btn-primary\" onclick=\"window.print()\">Download PDF</button>
                                    <button class=\"btn btn-light\" onclick=\"window.location.reload()\">Refresh</button>
                                </div>
                                <div class=\"footer\">Generated on <span id=\"generatedAt\"></span></div>
                            </div>
                        </div>
                        <script>
                            document.getElementById('generatedAt').textContent = new Date().toLocaleString();
                        </script>
                    </body>
                </html>
                """
                .formatted(
                        safeTitle,
                        safeStatus,
                        safeRequesterName,
                        safeRequesterEmail,
                        safeRequesterItNumber,
                        escapeHtml(String.valueOf(booking.id())),
                        safeResourceType,
                        safeResourceName,
                        safeDate,
                        safeStart,
                        safeEnd,
                        safePurpose,
                        safeCheckedIn,
                        safeCheckedInAt);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingResponse> updateBooking(
            @PathVariable Long id,
            @RequestParam String email,
            @Valid @RequestBody UpdateBookingRequest request) {
        BookingResponse updated = bookingService.updateBooking(id, email, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<BookingResponse> approveBooking(
            @PathVariable Long id,
            @Valid @RequestBody AdminDecisionRequest request) {
        BookingResponse updated = bookingService.approveBooking(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody AdminDecisionRequest request) {
        BookingResponse updated = bookingService.rejectBooking(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @RequestParam String email) {
        BookingResponse updated = bookingService.cancelBooking(id, email);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(
            @PathVariable Long id,
            @RequestParam String email) {
        bookingService.deleteBooking(id, email);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/check-in")
    public ResponseEntity<BookingResponse> checkIn(
            @PathVariable Long id,
            @RequestParam String token) {
        BookingResponse updated = bookingService.checkIn(id, token);
        return ResponseEntity.ok(updated);
    }
}
