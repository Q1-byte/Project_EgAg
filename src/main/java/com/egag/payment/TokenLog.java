package com.egag.payment;

import com.egag.common.domain.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // ✅ 추가
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "token_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TokenLog {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    // ✅ JPA 프록시 객체의 내부 필드(handler 등)가 JSON으로 변환되는 것을 방지합니다.
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;

    @Column(nullable = false)
    private Integer amount;

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(length = 100)
    private String reason;

    @Column(name = "reference_id", length = 36)
    private String referenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    // ✅ 관리자 정보도 동일하게 설정합니다.
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User admin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}