package com.egag.payment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/packages")
    public ResponseEntity<List<PackageDto>> getPackages() {
        return ResponseEntity.ok(paymentService.getPackages());
    }

    @PostMapping("/portone/complete")
    public ResponseEntity<PaymentResponse> completePortonePayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentCompleteRequest request) {
        return ResponseEntity.ok(
            paymentService.completePortonePayment(userDetails.getUsername(), request));
    }

    @PostMapping("/bank-transfer")
    public ResponseEntity<PaymentResponse> requestBankTransfer(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody BankTransferRequest request) {
        return ResponseEntity.ok(
            paymentService.requestBankTransfer(userDetails.getUsername(), request));
    }

    @PostMapping("/kakaopay/ready")
    public ResponseEntity<Map<String, String>> kakaoPayReady(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        Map<String, String> result = paymentService.kakaoPayReady(
            userDetails.getUsername(), request.get("packageId"));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/toss/prepare")
    public ResponseEntity<Map<String, String>> tossPrepare(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(paymentService.tossPrepare(userDetails.getUsername(), request.get("packageId")));
    }

    @GetMapping("/toss/callback")
    public ResponseEntity<Void> tossCallback(
            @RequestParam("paymentKey") String paymentKey,
            @RequestParam("orderId") String orderId,
            @RequestParam("amount") int amount) {
        String redirectUrl = paymentService.tossCallback(paymentKey, orderId, amount);
        return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();
    }

    @PostMapping("/toss/confirm")
    public ResponseEntity<PaymentResponse> tossPayConfirm(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TossPaymentConfirmRequest request) {
        return ResponseEntity.ok(
            paymentService.tossPayConfirm(userDetails.getUsername(), request));
    }

    @GetMapping("/status/{orderId}")
    public ResponseEntity<Map<String, String>> getPaymentStatus(@PathVariable String orderId) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(orderId));
    }

    @GetMapping("/kakaopay/approve")
    public ResponseEntity<Void> kakaoPayApprove(
            @RequestParam("pg_token") String pgToken,
            @RequestParam("order_id") String orderId) {
        String redirectUrl = paymentService.kakaoPayApprove(pgToken, orderId);
        return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();
    }
}
