package com.egag.admin;

import com.egag.admin.dto.AdminDashboardStatsResponse;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AdminActionLogRepository logRepository;
    private final PaymentRepository paymentRepository; // ✅ 추가: 결제 데이터 조회를 위해 주입

    // 📊 [최종 수정] 모든 데이터를 실시간 DB 연동으로 변경
    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getRealDashboardStats() {
        // 1. 유저 관련 통계
        long totalUsers = userRepository.count();
        LocalDateTime startOfToday = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long todayNewUsers = userRepository.countByCreatedAtAfter(startOfToday);
        long suspendedUsers = userRepository.countByIsSuspended(true);

        // 2. 💰 매출 관련 통계 (진짜 데이터 연동)
        // paymentRepository에 합산 메서드가 구현되어 있어야 합니다.
        Long totalSales = paymentRepository.sumTotalAmount();
        Long todaySales = paymentRepository.sumAmountByCreatedAtAfter(startOfToday);

        // null 체크: 데이터가 없을 경우 0으로 처리 (NPE 방지)
        totalSales = (totalSales != null) ? totalSales : 0L;
        todaySales = (todaySales != null) ? todaySales : 0L;

        return AdminDashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .todayNewUsers(todayNewUsers)
                .totalSales(totalSales) // DTO가 long/Long 타입을 받도록 설계되었다면 그대로 사용
                .todaySales(todaySales)
                .suspendedUsers(suspendedUsers)
                .activeUsers(totalUsers - suspendedUsers)
                .build();
    }

    // ✅ 모든 토큰 지급 로그 조회
    @Transactional(readOnly = true)
    public List<AdminActionLog> getAllTokenLogs() {
        return logRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void giveManualToken(String adminId, String userId, Integer amount, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        user.addToken(amount);

        AdminActionLog log = AdminActionLog.builder()
                .adminId(adminId)
                .targetUserId(userId)
                .targetNickname(user.getNickname())
                .amount(amount)
                .reason(reason)
                .createdAt(LocalDateTime.now())
                .build();

        logRepository.save(log);
    }
}
//테스트2