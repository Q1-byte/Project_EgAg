package com.egag.admin.dto;

import com.egag.payment.Payment;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminPaymentResponse {
    private String id;
    private String userId;      // 유저 고유 ID
    private String userEmail;   // (추가) 관리자 페이지에서 보기 편하게 이메일도 포함
    private Integer amount;     // 엔티티가 Integer이므로 타입 맞춤
    private String status;
    private String payMethod;
    private String orderName;   // 엔티티의 packageName 매핑
    private String orderId;     // 엔티티의 merchantUid 매핑
    private LocalDateTime createdAt;

    public static AdminPaymentResponse of(Payment entity) {
        return AdminPaymentResponse.builder()
                .id(entity.getId())
                // ✅ 연관관계인 user 객체에서 ID와 Email을 가져옵니다.
                .userId(entity.getUser() != null ? entity.getUser().getId().toString() : "Unknown")
                .userEmail(entity.getUser() != null ? entity.getUser().getEmail() : "N/A")
                .amount(entity.getAmount())
                .status(entity.getStatus())
                .payMethod(entity.getPayMethod())
                // ✅ 엔티티의 필드명에 맞춰 메서드 호출
                .orderName(entity.getPackageName())  // packageName -> orderName
                .orderId(entity.getMerchantUid())    // merchantUid -> orderId
                .createdAt(entity.getCreatedAt())
                .build();
    }
}