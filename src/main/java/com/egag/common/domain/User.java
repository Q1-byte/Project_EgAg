package com.egag.common.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false, unique = true, length = 12)
    private String nickname;

    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;

    @Column(length = 20)
    @Builder.Default
    private String provider = "email";

    @Column(name = "provider_id")
    private String providerId;

    @Column(length = 10)
    @Builder.Default
    private String role = "user";

    @Column(name = "token_balance", nullable = false)
    @Builder.Default
    private Integer tokenBalance = 3;

    @Column(name = "is_suspended")
    @Builder.Default
    private Boolean isSuspended = false;

    @Column(name = "follower_count")
    @Builder.Default
    private Integer followerCount = 0;

    @Column(name = "following_count")
    @Builder.Default
    private Integer followingCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
