# Smart Campus Resource Management System

## 📌 Project Overview

This system manages campus resources, bookings, and maintenance tickets.

---

## 👥 Group Members

* Pireethika R
* 

---

## 🚀 Features

### Module A – Resource Management

* Manage lecture halls, labs, equipment
* Resource details: type, capacity, location

### Module B – Booking System

* Create booking requests
* Workflow: PENDING → APPROVED / REJECTED / CANCELLED
* Conflict detection implemented

### Module C – Ticketing System

* Create maintenance tickets
* Upload up to 3 images
* Assign technician
* Status tracking

### Module D – Notifications

* Notification panel UI
* Alerts for booking and ticket updates

### Module E – Authentication

* Google OAuth login
* Role-based access (ADMIN / USER)

---

## 🛠️ Tech Stack

* Backend: Spring Boot
* Frontend: React (Vite)
* Database: MySQL
* Authentication: OAuth2 (Google)

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/it3030-paf-2026-smart-campus-groupXX
cd it3030-paf-2026-smart-campus-groupXX
```

---

### 2. Setup Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on:

```
http://localhost:8080
```

---

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

### 4. Database Setup

Create database:

```sql
CREATE DATABASE smartcampus;
```

Update credentials in:

```
application.properties
```

---

## 🔐 Default Admin Login

```
Email: admin@smartcampus.com
Password: Admin@123
```
---

## 📌 Notes

* Ensure MySQL is running
* Use Java 17
