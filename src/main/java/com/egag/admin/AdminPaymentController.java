package com.egag.admin;

import com.egag.admin.dto.AdminPaymentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payment-list")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    @GetMapping
    public ResponseEntity<List<AdminPaymentResponse>> getAllPayments() {
        // 서비스에서 데이터를 가져와서 반환
        return ResponseEntity.ok(adminPaymentService.findAllPayments());
    }
}
