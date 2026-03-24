package com.egag.user;

import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final StreakClaimRepository streakClaimRepository;

    private static final int[] STREAK_DAYS    = {3, 7, 30};
    private static final int[] STREAK_BONUSES = {1, 3, 10};

    @Transactional
    public void checkIn(String userId) {
        log.info("🐣 출석 체크 시도: userId={}", userId);
        
        if (userId == null) {
            log.error("❌ userId가 null입니다.");
            throw new CustomException(HttpStatus.BAD_REQUEST, "INVALID_USER", "사용자 정보가 정확하지 않아요.");
        }

        ZoneId kst = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(kst);
        
        // 오늘 이미 출석했는지 확인
        if (attendanceRepository.findByUserIdAndAttendanceDate(userId, today).isPresent()) {
            log.warn("🚨 중복 출석 시도 발견: userId={}, date={}", userId, today);
            throw new CustomException(HttpStatus.BAD_REQUEST, "ALREADY_ATTENDED", "오늘은 이미 도장을 찍었어요! 내일 또 만나요 ✨");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("❌ 사용자를 찾을 수 없음: userId={}", userId);
                    return new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.");
                });

        // 출석 기록 저장
        try {
            Attendance attendance = Attendance.builder()
                    .id(UUID.randomUUID().toString())
                    .user(user)
                    .attendanceDate(today)
                    .build();
            attendanceRepository.save(attendance);
            log.info("✅ 출석 기록 저장 완료: userId={}, date={}", userId, today);
        } catch (Exception e) {
            log.error("❌ 출석 기록 저장 중 데이터베이스 오류: {}", e.getMessage(), e);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "서버가 조금 아프대요. 잠시 후 다시 시도해 주세요! 🐣");
        }

        // 토큰 1개 지급
        try {
            user.addToken(1);
            userRepository.save(user);
            log.info("💰 토큰 1개 지급 완료: userId={}, 현재 토큰={}", userId, user.getTokenBalance());
        } catch (Exception e) {
            log.error("❌ 토큰 지급 중 오류: {}", e.getMessage(), e);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "TOKEN_UPDATE_FAILED", "토큰 보물상자를 여는 중 문제가 생겼어요.");
        }
    }

    public boolean hasAttendedToday(String userId) {
        if (userId == null) return false;
        ZoneId kst = ZoneId.of("Asia/Seoul");
        return attendanceRepository.findByUserIdAndAttendanceDate(userId, LocalDate.now(kst)).isPresent();
    }

    public List<Attendance> getHistory(String userId) {
        if (userId == null) return List.of();
        return attendanceRepository.findByUserIdOrderByAttendanceDateDesc(userId);
    }

    public List<Integer> getClaimedDays(String userId) {
        return streakClaimRepository.findByUserId(userId)
                .stream().map(StreakClaim::getDays).toList();
    }

    @Transactional
    public int claimStreakBonus(String userId, int days) {
        // 유효한 미션인지 확인
        int bonus = -1;
        for (int i = 0; i < STREAK_DAYS.length; i++) {
            if (STREAK_DAYS[i] == days) { bonus = STREAK_BONUSES[i]; break; }
        }
        if (bonus < 0) throw new CustomException(HttpStatus.BAD_REQUEST, "INVALID_DAYS", "잘못된 미션입니다.");

        // 이미 수령했는지 확인
        if (streakClaimRepository.existsByUserIdAndDays(userId, days))
            throw new CustomException(HttpStatus.BAD_REQUEST, "ALREADY_CLAIMED", "이미 수령한 보너스예요!");

        // 연속 일수 계산
        List<Attendance> history = attendanceRepository.findByUserIdOrderByAttendanceDateDesc(userId);
        int streak = 0;
        ZoneId kst = ZoneId.of("Asia/Seoul");
        LocalDate cursor = LocalDate.now(kst);
        for (Attendance a : history) {
            if (a.getAttendanceDate().equals(cursor)) { streak++; cursor = cursor.minusDays(1); }
            else break;
        }
        if (streak < days)
            throw new CustomException(HttpStatus.BAD_REQUEST, "NOT_ENOUGH_STREAK", "아직 연속 출석 일수가 부족해요.");

        // 토큰 지급 및 수령 기록 저장
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
        user.addToken(bonus);
        userRepository.save(user);

        streakClaimRepository.save(StreakClaim.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .days(days)
                .build());

        log.info("🎁 연속 출석 보너스 지급: userId={}, days={}, bonus={}", userId, days, bonus);
        return bonus;
    }
}
