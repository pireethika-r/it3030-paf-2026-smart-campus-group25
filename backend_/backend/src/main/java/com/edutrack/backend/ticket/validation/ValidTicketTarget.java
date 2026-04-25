package com.edutrack.backend.ticket.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Documented
@Constraint(validatedBy = ValidTicketTargetValidator.class)
@Target({TYPE})
@Retention(RUNTIME)
public @interface ValidTicketTarget {
    String message() default "Either resourceId or location must be provided";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}