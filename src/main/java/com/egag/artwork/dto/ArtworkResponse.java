package com.egag.artwork.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtworkResponse {
    private String id;
    private String userId;
    private String userNickname;
    private String title;
    private String topic;
    private String imageUrl;
    private List<StrokeDTO> strokeData;
    private String status;
    private boolean isPublic;
    private Integer likeCount;
    private Integer turnCount;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
