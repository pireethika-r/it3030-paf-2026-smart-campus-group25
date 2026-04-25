package com.edutrack.backend.auth.exception;

import com.edutrack.backend.booking.exception.BookingException;
import com.edutrack.backend.ticket.exception.TicketException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> response = baseErrorBody("Validation failed", HttpStatus.BAD_REQUEST.value());
        response.put("errors", fieldErrors);
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, Object>> handleAuthException(AuthException ex) {
        Map<String, Object> response = baseErrorBody(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(BookingException.class)
    public ResponseEntity<Map<String, Object>> handleBookingException(BookingException ex) {
        int status = ex.getStatus().value();
        Map<String, Object> response = baseErrorBody(ex.getMessage(), status);
        response.put("suggestions", ex.getSuggestions());
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(TicketException.class)
    public ResponseEntity<Map<String, Object>> handleTicketException(TicketException ex) {
        Map<String, Object> response = baseErrorBody(ex.getMessage(), ex.getStatus().value());
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        int status = ex.getStatusCode().value();
        Map<String, Object> response = baseErrorBody(ex.getReason() != null ? ex.getReason() : "Request failed", status);
        return ResponseEntity.status(ex.getStatusCode()).body(response);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, Object>> handleMissingRequestHeaderException(MissingRequestHeaderException ex) {
        String message = "Missing required header: " + ex.getHeaderName();
        Map<String, Object> response = baseErrorBody(message, HttpStatus.BAD_REQUEST.value());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> response = baseErrorBody("Unexpected server error", HttpStatus.INTERNAL_SERVER_ERROR.value());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private Map<String, Object> baseErrorBody(String message, int status) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", message);
        body.put("status", status);
        body.put("timestamp", LocalDateTime.now());
        return body;
    }
}
