package com.example.attendance;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AttendanceController {
    private final StudentRepository students;
    private final AttendanceRepository attendance;

    public AttendanceController(StudentRepository students, AttendanceRepository attendance) {
        this.students = students;
        this.attendance = attendance;
    }

    public record StudentRequest(String name, String rollNumber) {}
    public record AttendanceRequest(Long studentId, LocalDate date, String status) {}
    public record AttendanceSummary(Long studentId, String studentName, String rollNumber,
                                    String status, long presentDays, long absentDays, double percentage) {}

    @GetMapping("/students")
    public List<Student> getStudents() {
        return students.findAll();
    }

    @PostMapping("/students")
    @ResponseStatus(HttpStatus.CREATED)
    public Student addStudent(@RequestBody StudentRequest request) {
        if (request.name() == null || request.name().isBlank()
                || request.rollNumber() == null || request.rollNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and roll number are required");
        }
        String roll = request.rollNumber().trim();
        if (students.existsByRollNumberIgnoreCase(roll)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Roll number already exists");
        }
        return students.save(new Student(request.name().trim(), roll));
    }

    @DeleteMapping("/students/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Long id) {
        Student student = students.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        students.delete(student);
    }

    @PostMapping("/attendance")
    public Attendance saveAttendance(@RequestBody AttendanceRequest request) {
        if (request.studentId() == null || request.date() == null || request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student, date and status are required");
        }
        String status = request.status().trim().toUpperCase(Locale.ROOT);
        if (!status.equals("PRESENT") && !status.equals("ABSENT")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be PRESENT or ABSENT");
        }
        Student student = students.findById(request.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        Attendance record = attendance.findByStudent_IdAndDate(student.getId(), request.date())
                .orElseGet(() -> new Attendance(student, request.date(), status));
        record.setStudent(student);
        record.setDate(request.date());
        record.setStatus(status);
        return attendance.save(record);
    }

    @GetMapping("/attendance/summary")
    public List<AttendanceSummary> getSummary(@RequestParam LocalDate date) {
        List<Attendance> dayRecords = attendance.findByDate(date);
        return students.findAll().stream().map(student -> {
            List<Attendance> records = attendance.findByStudent_Id(student.getId());
            long present = records.stream().filter(a -> "PRESENT".equals(a.getStatus())).count();
            long absent = records.stream().filter(a -> "ABSENT".equals(a.getStatus())).count();
            long total = present + absent;
            double percentage = total == 0 ? 0.0 : (present * 100.0 / total);
            String status = dayRecords.stream()
                    .filter(a -> a.getStudent().getId().equals(student.getId()))
                    .map(Attendance::getStatus).findFirst().orElse(null);
            return new AttendanceSummary(student.getId(), student.getName(), student.getRollNumber(),
                    status, present, absent, percentage);
        }).toList();
    }
}
