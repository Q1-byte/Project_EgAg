package com.egag.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String type;
    private String actorId;
    private String actorNickname;
    private String actorProfileImage;
    private String artworkId;
    private String artworkTitle;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
