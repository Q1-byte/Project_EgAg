package com.egag.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndIsReadFalse(String userId);
    long countByUserIdAndIsReadFalse(String userId);
    void deleteByArtworkId(String artworkId);
}
