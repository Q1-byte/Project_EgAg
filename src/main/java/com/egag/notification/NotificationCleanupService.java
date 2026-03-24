package com.egag.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationCleanupService {

    private final NotificationRepository notificationRepository;

    /**
     * 매일 새벽 3시에 30일이 지난 알림을 자동으로 삭제합니다.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupOldNotifications() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        log.info("[NotificationCleanup] 30일 경과 알림 매일 정리 시작 (대상 기준: {})", thirtyDaysAgo);
        
        try {
            notificationRepository.deleteByCreatedAtBefore(thirtyDaysAgo);
            log.info("[NotificationCleanup] 정리가 완료되었습니다.");
        } catch (Exception e) {
            log.error("[NotificationCleanup] 정리 중 오류 발생: {}", e.getMessage());
        }
    }
}
