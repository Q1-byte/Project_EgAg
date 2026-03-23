package com.egag.common.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "artworks")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Artwork {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 100)
    private String title;

    @Column(length = 100)
    private String topic;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "user_image_data", columnDefinition = "LONGTEXT")
    private String userImageData;

    @Column(name = "stroke_data", nullable = false, columnDefinition = "JSON")
    private String strokeData;

    @Column(name = "ai_context", columnDefinition = "JSON")
    private String aiContext;

    @Column(name = "user_stroke_count")
    @Builder.Default
    private Integer userStrokeCount = 0;

    @Column(name = "ai_stroke_count")
    @Builder.Default
    private Integer aiStrokeCount = 0;

    @Column(name = "turn_count")
    @Builder.Default
    private Integer turnCount = 0;

    @Column(length = 20)
    @Builder.Default
    private String status = "drawing";

    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = true;

    @Column(name = "like_count")
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "report_count")
    @Builder.Default
    private Integer reportCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
