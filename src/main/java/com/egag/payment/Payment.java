package com.egag.payment;

import com.egag.common.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Payment {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "imp_uid", unique = true)
    private String impUid;

    @Column(name = "merchant_uid", unique = true, nullable = false)
    private String merchantUid;

    @Column(name = "package_name", nullable = false, length = 50)
    private String packageName;

    @Column(name = "token_amount", nullable = false)
    private Integer tokenAmount;

    @Column(nullable = false)
    private Integer amount;

    @Column(name = "pay_method", nullable = false, length = 30)
    private String payMethod;

    @Column(length = 20)
    @Builder.Default
    private String status = "paid";

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
