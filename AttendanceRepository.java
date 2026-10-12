package com.example.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByStudent_IdAndDate(Long studentId, LocalDate date);
    List<Attendance> findByStudent_Id(Long studentId);
    List<Attendance> findByDate(LocalDate date);
}
