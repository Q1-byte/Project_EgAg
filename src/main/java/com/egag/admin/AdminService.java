package com.egag.admin;

import com.egag.admin.dto.AdminDashboardStatsResponse;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.payment.PaymentRepository;
import com.egag.payment.TokenLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TokenLogRepository tokenLogRepository;
    private final UserRepository userRepository;
    private final AdminActionLogRepository logRepository;
    private final PaymentRepository paymentRepository;

    // 📊 실시간 대시보드 통계 계산
    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getRealDashboardStats() {
        long totalUsers = userRepository.count();
        LocalDateTime startOfToday = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long todayNewUsers = userRepository.countByCreatedAtAfter(startOfToday);
        long suspendedUsers = userRepository.countByIsSuspended(true);

        Long totalSales = paymentRepository.sumTotalAmount();
        Long todaySales = paymentRepository.sumAmountByCreatedAtAfter(startOfToday);

        totalSales = (totalSales != null) ? totalSales : 0L;
        todaySales = (todaySales != null) ? todaySales : 0L;

        return AdminDashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .todayNewUsers(todayNewUsers)
                .totalSales(totalSales)
                .todaySales(todaySales)
                .suspendedUsers(suspendedUsers)
                .activeUsers(totalUsers - suspendedUsers)
                .build();
    }

    // ✅ [추가] 유저 활성/비활성 상태 토글 로직
    @Transactional
    public void toggleUserStatus(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 현재 상태가 true면 false로, false면 true로 반전시킴
        boolean currentStatus = user.getIsSuspended() != null && user.getIsSuspended();
        user.setIsSuspended(!currentStatus);

        // 💡 팁: 실제 운영 환경에서는 누가 정지시켰는지 AdminActionLog에 기록을 남기는 것이 좋습니다.
    }

    // ✅ 모든 토큰 로그 조회 (전체 이력 통합)
    @Transactional(readOnly = true)
    public List<?> getAllTokenLogs() {
        // 이제 TokenLog 테이블을 조회하므로 가입, 구매, 수동지급 내역이 모두 나옵니다.
        return tokenLogRepository.findAllByOrderByCreatedAtDesc();
    }

    // 💰 수동 토큰 지급 로직
    @Transactional
    public void giveManualToken(String adminId, String userId, Integer amount, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 1. 유저 토큰 잔액 업데이트
        user.addToken(amount);

        // 2. 관리자 작업 로그 기록 (누가 누구에게 줬는지 관리자 전용 기록)
        AdminActionLog adminLog = AdminActionLog.builder()
                .adminId(adminId)
                .targetUserId(userId)
                .targetNickname(user.getNickname())
                .amount(amount)
                .reason(reason)
                .createdAt(LocalDateTime.now())
                .build();
        logRepository.save(adminLog);

        // 3. 🌟 실제 토큰 변동 이력(TokenLog)에도 기록 (이걸 해야 목록에 뜹니다!)
        com.egag.payment.TokenLog tokenLog = com.egag.payment.TokenLog.builder()
                .id(java.util.UUID.randomUUID().toString())
                .user(user)
                .amount(amount)
                .balanceAfter(user.getTokenBalance()) // 유저 엔티티의 현재 잔액 필드명 확인 필요
                .type("MANUAL") // 수동 지급 구분
                .reason(reason)
                .createdAt(LocalDateTime.now())
                .build();
        tokenLogRepository.save(tokenLog);
    }
}