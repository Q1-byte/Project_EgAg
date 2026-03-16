package com.egag.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByUserId(String userId);
    Optional<Payment> findByImpUid(String impUid);
    Optional<Payment> findByMerchantUid(String merchantUid);
}
