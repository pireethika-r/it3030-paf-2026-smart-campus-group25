package com.edutrack.backend.ticket.exception;

import org.springframework.http.HttpStatus;

public class TicketException extends RuntimeException {

    private final HttpStatus status;

    public TicketException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}