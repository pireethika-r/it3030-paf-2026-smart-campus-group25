package com.edutrack.backend.booking.repository;

import com.edutrack.backend.booking.entity.Booking;
import com.edutrack.backend.booking.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

        List<Booking> findAllByOrderByBookingDateAscStartTimeAsc();

        List<Booking> findByRequesterEmailIgnoreCaseOrderByBookingDateAscStartTimeAsc(String requesterEmail);

        List<Booking> findByStatusOrderByBookingDateAscStartTimeAsc(BookingStatus status);

        List<Booking> findByBookingDateBetweenOrderByBookingDateAscStartTimeAsc(LocalDate from, LocalDate to);

        List<Booking> findByRequesterEmailIgnoreCaseAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                        String requesterEmail,
                        LocalDate from,
                        LocalDate to);

        List<Booking> findByRequesterEmailIgnoreCaseAndStatusInAndBookingDateBetweenOrderByBookingDateAscStartTimeAsc(
                        String requesterEmail,
                        List<BookingStatus> statuses,
                        LocalDate from,
                        LocalDate to);

        long countByRequesterEmailIgnoreCase(String requesterEmail);

        long countByRequesterEmailIgnoreCaseAndStatus(String requesterEmail, BookingStatus status);

        long countByRequesterEmailIgnoreCaseAndCheckedInTrue(String requesterEmail);

        long countByResourceNameIgnoreCaseAndBookingDateAndStatusIn(
                        String resourceName,
                        LocalDate bookingDate,
                        List<BookingStatus> statuses);

        Booking findTopByRequesterEmailIgnoreCaseAndBookingDateGreaterThanEqualOrderByBookingDateAscStartTimeAsc(
                        String requesterEmail,
                        LocalDate fromDate);

        Optional<Booking> findByQrToken(String qrToken);

        @Query("""
                        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
                        FROM Booking b
                        WHERE LOWER(b.resourceName) = LOWER(:resourceName)
                                AND b.bookingDate = :bookingDate
                                AND b.status IN :statuses
                                AND b.startTime < :endTime
                                AND b.endTime > :startTime
                        """)
        boolean existsOverlappingBooking(
                        @Param("resourceName") String resourceName,
                        @Param("bookingDate") LocalDate bookingDate,
                        @Param("startTime") LocalTime startTime,
                        @Param("endTime") LocalTime endTime,
                        @Param("statuses") List<BookingStatus> statuses);

        @Query("""
                        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
                        FROM Booking b
                        WHERE LOWER(b.resourceName) = LOWER(:resourceName)
                                AND b.bookingDate = :bookingDate
                                AND b.status IN :statuses
                                AND b.startTime < :endTime
                                AND b.endTime > :startTime
                                AND b.id <> :excludeId
                        """)
        boolean existsOverlappingBookingExcludingId(
                        @Param("resourceName") String resourceName,
                        @Param("bookingDate") LocalDate bookingDate,
                        @Param("startTime") LocalTime startTime,
                        @Param("endTime") LocalTime endTime,
                        @Param("statuses") List<BookingStatus> statuses,
                        @Param("excludeId") Long excludeId);
}
