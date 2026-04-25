# Team Work Division and Delivery Plan

## Tech Stack

- Backend: Spring Boot, Java 21, IntelliJ IDEA
- Frontend: React, VS Code
- Database: MySQL
- CI/CD: GitHub + GitHub Actions

## Branch Strategy

- `main`: stable code only
- `develop`: integration branch
- Feature branches:
  - `feature/booking-management` (Mathuran)
  - `feature/resource-management`
  - `feature/ticket-management`
  - `feature/notification-auth-integration`

## Commit Discipline

- Commit at least once per logical task.
- Use clear commit messages.
- Suggested style:
  - `feat(booking): add overlap conflict check`
  - `fix(booking): restrict update to pending status`
  - `docs(team): add viva ownership notes`

## 4-Member Ownership

1. Mathuran: Booking Management
   - Create booking request
   - View own bookings
   - Update booking (only if allowed)
   - Cancel booking
   - Admin approve/reject
   - Conflict detection and overlap prevention
2. Member 2: Resource/Room catalog and availability
3. Member 3: Ticket/incident management
4. Member 4: Notification and cross-module integration

## Delivery Phases

1. Minimum Requirements First
   - Core CRUD and status flow complete
   - Integration with MySQL complete
   - Backend and frontend build green in CI
2. Innovation Layer
   - Smart alternative suggestions for conflict slots
   - Booking calendar view
   - QR-based check-in for approved bookings
   - Recurring weekly booking option

## Viva Notes for Mathuran

- Explain overlap detection rule:
  - overlap exists when `existingStart < requestedEnd` and `existingEnd > requestedStart`
- Explain approval flow:
  - `PENDING -> APPROVED` or `PENDING -> REJECTED`
- Explain cancellation flow:
  - `PENDING/APPROVED -> CANCELLED`
- Explain innovation:
  - conflict suggestions returned when overlap occurs
  - calendar endpoint for timeline view
  - QR token generated on approval and used at check-in
  - recurring count creates weekly sequence bookings
