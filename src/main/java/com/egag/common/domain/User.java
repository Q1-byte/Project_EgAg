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
    @Column(length = 36) // 기존 팀원 규칙: String ID (UUID 등)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(length = 50)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, unique = true, length = 12)
    private String nickname; // 본인의 username 대신 기존의 nickname을 사용하거나 둘 다 유지

    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;

    @Column(length = 20)
    @Builder.Default
    private String provider = "email";

    @Column(name = "provider_id")
    private String providerId;

    // 본인이 원했던 Role enum 구조를 팀원 규칙(String)에 맞춰 적용하거나
    // 팀원들이 쓰던 String role을 유지합니다. 여기서는 안전하게 기존 규칙 유지!
    @Column(length = 10)
    @Builder.Default
    private String role = "USER";

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

    // 필요하다면 Role enum을 내부에 선언만 해두고 꺼내 쓸 수 있습니다.
    public enum Role {
        USER, ADMIN
    }
}