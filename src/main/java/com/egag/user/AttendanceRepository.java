package com.egag.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, String> {
    
    @Query("SELECT a FROM Attendance a WHERE a.user.id = :userId AND a.attendanceDate = :date")
    Optional<Attendance> findByUserIdAndAttendanceDate(@Param("userId") String userId, @Param("date") LocalDate date);
    
    @Query("SELECT a FROM Attendance a WHERE a.user.id = :userId ORDER BY a.attendanceDate DESC")
    List<Attendance> findByUserIdOrderByAttendanceDateDesc(@Param("userId") String userId);
}
