# Student Attendance Management System

A mini project using HTML, CSS, JavaScript, Spring Boot, Spring Data JPA, and MySQL.

## Requirements
- JDK 17 or newer
- Maven 3.6+ (or use the Maven wrapper provided by your IDE)
- MySQL Server

## 1. Configure MySQL
Open `backend/src/main/resources/application.properties` and replace `YOUR_MYSQL_PASSWORD` with your MySQL root password. The app creates `attendance_db` automatically if your MySQL user has permission. Alternatively, run:

```sql
CREATE DATABASE attendance_db;
```

## 2. Run the backend
Open a terminal in the `backend` folder and run:

```bash
mvn spring-boot:run
```

The REST API runs at `http://localhost:8080`.

## 3. Run the frontend
Open `frontend/index.html` in your browser. If your browser blocks local-file requests, run a local server from the `frontend` folder, for example:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Features
- Add students with unique roll numbers
- Choose an attendance date
- Mark and update Present/Absent attendance
- View present days, absent days, and attendance percentage
- Delete a student and their attendance records
- Store data in MySQL

## API endpoints
- `GET /api/students`
- `POST /api/students` JSON: `{"name":"Asha","rollNumber":"101"}`
- `DELETE /api/students/{id}`
- `GET /api/attendance/summary?date=2026-10-12`
- `POST /api/attendance` JSON: `{"studentId":1,"date":"2026-10-12","status":"PRESENT"}`

Attendance percentage is calculated from recorded attendance days only. A student can have only one attendance record per date; saving again updates that record.
