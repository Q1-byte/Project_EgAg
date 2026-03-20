package com.egag.admin;

import com.egag.admin.dto.AdminPaymentResponse;
import com.egag.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminPaymentService {

    private final PaymentRepository paymentRepository; // 기존 결제 레포지토리 사용

    public List<AdminPaymentResponse> findAllPayments() {
        return paymentRepository.findAll().stream()
                .map(AdminPaymentResponse::of) // Entity를 DTO로 변환
                .collect(Collectors.toList());
    }
}