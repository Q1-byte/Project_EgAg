package com.egag.notification;

import com.egag.auth.PrincipalDetails;
import com.egag.common.exception.CustomException;
import com.egag.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> getNotifications(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        return notificationService.getNotifications(principal.getUserId());
    }

    @PostMapping("/read-all")
    public void markAllAsRead(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        notificationService.markAllAsRead(principal.getUserId());
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        return notificationService.getUnreadCount(principal.getUserId());
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable String id, @AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        notificationService.deleteNotification(id, principal.getUserId());
    }

    @DeleteMapping
    public void deleteAllNotifications(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        notificationService.deleteAllNotifications(principal.getUserId());
    }
}
