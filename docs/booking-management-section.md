# Mathuran - Booking Management

## Contribution Scope

I implemented the Booking Management module for the Smart Campus Operations Hub. This part covers booking creation, approval workflow, cancellation, conflict prevention, calendar visibility, and QR check-in support.

## Assignment Alignment

This contribution maps directly to the IT3030 minimum requirements and the optional innovation layer:

- Minimum requirements covered:
  - Create booking request
  - View own bookings
  - Update booking if allowed
  - Cancel booking
  - Admin approve/reject booking
  - Prevent overlapping bookings
- Innovation features covered:
  - Smart conflict detection with alternative suggestions
  - Booking calendar view
  - QR-based check-in for approved bookings
  - Recurring booking option

## Backend Implementation

### Stack

- Spring Boot REST API
- Java 21
- MySQL database
- Validation and global exception handling

### Main Entity

The booking entity stores:

- requester name, email, and IT number
- resource type and resource name
- purpose
- booking date, start time, and end time
- booking status
- admin note
- QR token and check-in details
- recurring group information

### Booking Status Flow

The booking lifecycle follows this workflow:

- `PENDING` -> `APPROVED`
- `PENDING` -> `REJECTED`
- `PENDING` / `APPROVED` -> `CANCELLED`
- `APPROVED` -> `CHECK-IN` through QR token verification

### Conflict Detection Logic

I prevent overlapping bookings using time-range overlap checking for the same resource on the same date.

The overlap rule is:

- conflict exists if `existingStart < requestedEnd` and `existingEnd > requestedStart`

This ensures back-to-back bookings are allowed, but overlapping ranges are rejected.

### Smart Suggestions

When a conflict is detected, the backend returns alternative available slots so the user can choose another time. This improves usability and makes the booking flow more intelligent.

### Recurring Booking

The booking form accepts a recurrence count. If more than one booking is requested, the system creates weekly bookings using the same time range and resource, grouped under a common recurrence ID.

### QR Check-in

When an admin approves a booking, the backend generates a QR token. The approved booking can later be checked in using that token, which is useful for attendance or room access verification.

## Backend Endpoints

These are the endpoints implemented for the booking module:

- `POST /api/bookings` - create booking request
- `GET /api/bookings/my` - view own bookings
- `GET /api/bookings` - admin/all bookings with filters
- `GET /api/bookings/{id}` - view single booking
- `PUT /api/bookings/{id}` - update booking if allowed
- `PATCH /api/bookings/{id}/approve` - approve booking
- `PATCH /api/bookings/{id}/reject` - reject booking
- `PATCH /api/bookings/{id}/cancel` - cancel booking
- `GET /api/bookings/calendar` - calendar view data
- `PATCH /api/bookings/{id}/check-in` - QR check-in

## Frontend Implementation

### Stack

- React
- React Router
- Vite
- VS Code

### Pages Built

- Booking form page
- My bookings page
- Booking approval page for admin
- Calendar/schedule page

### UI Flow

- Users create a booking from the form page
- Users open the my bookings page to view, update, or cancel their own requests
- Admins review pending requests from the approval page
- The calendar page shows bookings grouped by date and supports QR check-in for approved bookings

## Database

The module persists data in MySQL. This keeps the system aligned with the assignment requirement to use a real database instead of in-memory storage.

## GitHub and CI

The repository includes a GitHub Actions workflow so backend and frontend can be validated early through automated builds.

## Viva Points

For the viva, I should be able to explain:

- how booking conflicts are detected
- how approval and rejection work
- how booking statuses change across the workflow
- how QR check-in improves verification
- how smart slot suggestions help users recover from booking conflicts

## Minimum First, Innovation Second

The module was structured in two layers:

1. Minimum requirements first
   - booking creation
   - my bookings
   - update
   - cancel
   - approve/reject
   - conflict prevention
2. Innovation features after that
   - alternative slot suggestions
   - calendar view
   - QR check-in
   - recurring booking

## Suggested Contribution Statement

I implemented the Booking Management module, including booking request handling, approval workflow, cancellation, conflict checking, calendar support, QR-based check-in, and recurring booking functionality. This module is fully integrated with Spring Boot, React, and MySQL.
