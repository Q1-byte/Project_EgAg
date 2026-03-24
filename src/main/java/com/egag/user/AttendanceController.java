package com.egag.user;

import com.egag.auth.PrincipalDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/today")
    public ResponseEntity<?> getTodayStatus(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        boolean attended = attendanceService.hasAttendedToday(principal.getUserId());
        return ResponseEntity.ok(Map.of("attended", attended));
    }

    @PostMapping
    public ResponseEntity<?> checkIn(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        attendanceService.checkIn(principal.getUserId());
        return ResponseEntity.ok(Map.of("message", "출석 도장 꾹! 1토큰을 받았어요! 🐤✨"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        List<String> dates = attendanceService.getHistory(principal.getUserId())
                .stream()
                .map(a -> a.getAttendanceDate().toString())
                .collect(Collectors.toList());
        return ResponseEntity.ok(dates);
    }

    @GetMapping("/claimed-bonuses")
    public ResponseEntity<?> getClaimedBonuses(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(attendanceService.getClaimedDays(principal.getUserId()));
    }

    @PostMapping("/claim-streak")
    public ResponseEntity<?> claimStreak(
            @AuthenticationPrincipal PrincipalDetails principal,
            @RequestParam int days) {
        if (principal == null) return ResponseEntity.status(401).build();
        int bonus = attendanceService.claimStreakBonus(principal.getUserId(), days);
        return ResponseEntity.ok(Map.of("bonus", bonus, "message", "🎉 보너스 " + bonus + " 토큰이 지급됐어요!"));
    }
}
