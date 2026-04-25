package com.edutrack.backend.ticket.validation;

import com.edutrack.backend.ticket.dto.CreateTicketRequest;
import com.edutrack.backend.ticket.dto.UpdateTicketRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidTicketTargetValidator implements ConstraintValidator<ValidTicketTarget, Object> {

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        Long resourceId = null;
        String location = null;

        if (value instanceof CreateTicketRequest request) {
            resourceId = request.resourceId();
            location = request.location();
        } else if (value instanceof UpdateTicketRequest request) {
            resourceId = request.resourceId();
            location = request.location();
        }

        boolean hasResource = resourceId != null;
        boolean hasLocation = location != null && !location.trim().isBlank();
        return hasResource || hasLocation;
    }
}