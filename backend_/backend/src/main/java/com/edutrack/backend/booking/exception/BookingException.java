package com.edutrack.backend.booking.exception;

import org.springframework.http.HttpStatus;

import java.util.List;

public class BookingException extends RuntimeException {

    private final HttpStatus status;
    private final List<String> suggestions;

    public BookingException(String message) {
        this(message, HttpStatus.BAD_REQUEST, List.of());
    }

    public BookingException(String message, HttpStatus status) {
        this(message, status, List.of());
    }

    public BookingException(String message, HttpStatus status, List<String> suggestions) {
        super(message);
        this.status = status;
        this.suggestions = suggestions;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }
}
