package com.egag.notification;

import com.egag.common.domain.Artwork;
import com.egag.common.domain.User;
import com.egag.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void createLikeNotification(User recipient, User actor, Artwork artwork) {
        if (recipient.getId().equals(actor.getId())) return;
        
        Notification notification = Notification.builder()
                .id(java.util.UUID.randomUUID().toString())
                .user(recipient)
                .actor(actor)
                .artwork(artwork)
                .type("LIKE")
                .build();
        notificationRepository.save(notification);
    }

    public void createFollowNotification(User recipient, User actor) {
        if (recipient.getId().equals(actor.getId())) return;

        Notification notification = Notification.builder()
                .id(java.util.UUID.randomUUID().toString())
                .user(recipient)
                .actor(actor)
                .type("FOLLOW")
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalse(userId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void createInquiryReplyNotification(User recipient, String inquiryTitle) {
        Notification notification = Notification.builder()
                .id(java.util.UUID.randomUUID().toString())
                .user(recipient)
                .actor(recipient)
                .type("INQUIRY_REPLY")
                .message(inquiryTitle)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void deleteAllNotifications(String userId) {
        notificationRepository.deleteAllByUserId(userId);
    }

    @Transactional
    public void deleteNotification(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다."));
        if (!notification.getUser().getId().equals(userId))
            throw new RuntimeException("삭제 권한이 없습니다.");
        notificationRepository.delete(notification);
    }

    private NotificationResponse convertToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .actorId(n.getActor().getId())
                .actorNickname(n.getActor().getNickname())
                .actorProfileImage(n.getActor().getProfileImageUrl())
                .artworkId(n.getArtwork() != null ? n.getArtwork().getId() : null)
                .artworkTitle(n.getArtwork() != null ? n.getArtwork().getTitle() : null)
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
