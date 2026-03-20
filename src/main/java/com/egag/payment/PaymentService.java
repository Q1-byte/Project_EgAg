package com.egag.payment;

import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TokenLogRepository tokenLogRepository;
    private final UserRepository userRepository;

    @Value("${tosspay.secret-key:}")
    private String tossSecretKey;

    @Value("${portone.api-key:}")
    private String portoneApiKey;

    @Value("${portone.api-secret:}")
    private String portoneApiSecret;

    @Value("${kakaopay.secret-key:}")
    private String kakaoPaySecretKey;

    @Value("${kakaopay.cid:TC0ONETIME}")
    private String kakaoPayCid;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    private static final String ACCOUNT_HOLDER = "데칼코";
    private static final Map<String, String[]> BANK_ACCOUNTS = Map.of(
        "kakao",  new String[]{"카카오뱅크",  "3333-01-1234567"},
        "toss",   new String[]{"토스뱅크",    "1000-1234-5678"},
        "kb",     new String[]{"국민은행",    "123456-78-901234"},
        "shinhan",new String[]{"신한은행",    "110-123-456789"}
    );

    public List<PackageDto> getPackages() {
        return List.of(
            new PackageDto(PackageInfo.BASIC.getId(),    PackageInfo.BASIC.getDisplayName(),    PackageInfo.BASIC.getTokenAmount(),    PackageInfo.BASIC.getPrice(),    false, false),
            new PackageDto(PackageInfo.STANDARD.getId(), PackageInfo.STANDARD.getDisplayName(), PackageInfo.STANDARD.getTokenAmount(), PackageInfo.STANDARD.getPrice(), true,  false),
            new PackageDto(PackageInfo.PREMIUM.getId(),  PackageInfo.PREMIUM.getDisplayName(),  PackageInfo.PREMIUM.getTokenAmount(),  PackageInfo.PREMIUM.getPrice(),  false, true),
            new PackageDto(PackageInfo.ULTRA.getId(),    PackageInfo.ULTRA.getDisplayName(),    PackageInfo.ULTRA.getTokenAmount(),    PackageInfo.ULTRA.getPrice(),    false, false)
        );
    }

    @Transactional
    public PaymentResponse completePortonePayment(String email, PaymentCompleteRequest req) {
        PackageInfo pkg = PackageInfo.fromId(req.getPackageId());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        verifyPortonePayment(req.getImpUid(), pkg.getPrice());

        Payment payment = Payment.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .impUid(req.getImpUid())
            .merchantUid(req.getMerchantUid())
            .packageName(pkg.getDisplayName())
            .tokenAmount(pkg.getTokenAmount())
            .amount(pkg.getPrice())
            .payMethod("portone")
            .status("paid")
            .paidAt(LocalDateTime.now())
            .build();
        paymentRepository.save(payment);

        int newBalance = user.getTokenBalance() + pkg.getTokenAmount();
        user.setTokenBalance(newBalance);
        userRepository.save(user);

        tokenLogRepository.save(TokenLog.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .amount(pkg.getTokenAmount())
            .balanceAfter(newBalance)
            .type("purchase")
            .reason(pkg.getDisplayName() + " 패키지 구매")
            .referenceId(payment.getId())
            .build());

        return PaymentResponse.builder()
            .success(true)
            .message("결제 완료! 토큰 " + pkg.getTokenAmount() + "개가 충전되었습니다.")
            .newTokenBalance(newBalance)
            .merchantUid(req.getMerchantUid())
            .build();
    }

    @Transactional
    public PaymentResponse requestBankTransfer(String email, BankTransferRequest req) {
        PackageInfo pkg = PackageInfo.fromId(req.getPackageId());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        String bankType = req.getBankType() != null ? req.getBankType() : "kakao";
        String[] bankInfo = BANK_ACCOUNTS.getOrDefault(bankType, BANK_ACCOUNTS.get("kakao"));

        String merchantUid = "egag_" + pkg.getId().toLowerCase() + "_" + System.currentTimeMillis();
        String impUid = "bank_" + UUID.randomUUID().toString().replace("-", "");

        Payment payment = Payment.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .impUid(impUid)
            .merchantUid(merchantUid)
            .packageName(pkg.getDisplayName())
            .tokenAmount(pkg.getTokenAmount())
            .amount(pkg.getPrice())
            .payMethod("bank_transfer")
            .status("pending")
            .build();
        paymentRepository.save(payment);

        return PaymentResponse.builder()
            .success(true)
            .message("아래 계좌로 " + pkg.getPrice() + "원을 입금해주세요. 확인 후 토큰이 지급됩니다.")
            .merchantUid(merchantUid)
            .bankName(bankInfo[0])
            .bankAccount(bankInfo[1])
            .accountHolder(ACCOUNT_HOLDER)
            .build();
    }

    @Transactional
    public Map<String, String> kakaoPayReady(String email, String packageId) {
        PackageInfo pkg = PackageInfo.fromId(packageId);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        String merchantUid = "egag_" + pkg.getId().toLowerCase() + "_" + System.currentTimeMillis();

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "SECRET_KEY " + kakaoPaySecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("cid", kakaoPayCid);
        body.put("partner_order_id", merchantUid);
        body.put("partner_user_id", user.getEmail());
        body.put("item_name", pkg.getDisplayName() + " (토큰 " + pkg.getTokenAmount() + "개)");
        body.put("quantity", 1);
        body.put("total_amount", pkg.getPrice());
        body.put("tax_free_amount", 0);
        body.put("approval_url", "http://localhost:8080/api/payments/kakaopay/approve?order_id=" + merchantUid);
        body.put("cancel_url", appBaseUrl + "/token-shop?status=cancel");
        body.put("fail_url", appBaseUrl + "/token-shop?status=fail");

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://open-api.kakaopay.com/online/v1/payment/ready",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
            );

            String tid = (String) response.getBody().get("tid");
            String redirectUrl = (String) response.getBody().get("next_redirect_pc_url");

            Payment payment = Payment.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .impUid(tid)
                .merchantUid(merchantUid)
                .packageName(pkg.getDisplayName())
                .tokenAmount(pkg.getTokenAmount())
                .amount(pkg.getPrice())
                .payMethod("kakaopay")
                .status("ready")
                .build();
            paymentRepository.save(payment);

            return Map.of("redirectUrl", redirectUrl);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("카카오페이 결제 준비 실패: " + e.getResponseBodyAsString());
        }
    }

    @Transactional
    public String kakaoPayApprove(String pgToken, String orderId) {
        Payment payment = paymentRepository.findByMerchantUid(orderId)
            .orElseThrow(() -> new RuntimeException("결제 정보를 찾을 수 없습니다."));

        if (!"ready".equals(payment.getStatus())) {
            throw new RuntimeException("이미 처리된 결제입니다.");
        }

        User user = payment.getUser();

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "SECRET_KEY " + kakaoPaySecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("cid", kakaoPayCid);
        body.put("tid", payment.getImpUid());
        body.put("partner_order_id", orderId);
        body.put("partner_user_id", user.getEmail());
        body.put("pg_token", pgToken);

        try {
            restTemplate.exchange(
                "https://open-api.kakaopay.com/online/v1/payment/approve",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
            );
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("카카오페이 결제 승인 실패: " + e.getResponseBodyAsString());
        }

        payment.setStatus("paid");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        int newBalance = user.getTokenBalance() + payment.getTokenAmount();
        user.setTokenBalance(newBalance);
        userRepository.save(user);

        tokenLogRepository.save(TokenLog.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .amount(payment.getTokenAmount())
            .balanceAfter(newBalance)
            .type("purchase")
            .reason(payment.getPackageName() + " 패키지 구매 (카카오페이)")
            .referenceId(payment.getId())
            .build());

        return appBaseUrl + "/token-shop?status=success&tokens=" + payment.getTokenAmount() + "&balance=" + newBalance;
    }

    @Transactional
    public PaymentResponse tossPayConfirm(String email, TossPaymentConfirmRequest req) {
        PackageInfo pkg = PackageInfo.fromId(req.getPackageId());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (req.getAmount() != pkg.getPrice()) {
            throw new RuntimeException("결제 금액이 패키지 가격과 일치하지 않습니다.");
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        String credentials = tossSecretKey + ":";
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encoded);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("paymentKey", req.getPaymentKey());
        body.put("orderId", req.getOrderId());
        body.put("amount", req.getAmount());

        try {
            restTemplate.exchange(
                "https://api.tosspayments.com/v1/payments/confirm",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
            );
        } catch (HttpClientErrorException e) {
            String tossError = new String(e.getResponseBodyAsByteArray(), StandardCharsets.UTF_8);
            log.error("Toss confirm HTTP {} 실패: {}", e.getStatusCode().value(), tossError);
            throw new RuntimeException("[" + e.getStatusCode().value() + "] 토스페이 결제 확인 실패: " + tossError);
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            String tossError = new String(e.getResponseBodyAsByteArray(), StandardCharsets.UTF_8);
            log.error("Toss confirm HTTP {} 서버오류: {}", e.getStatusCode().value(), tossError);
            throw new RuntimeException("[" + e.getStatusCode().value() + "] 토스페이 서버 오류: " + tossError);
        } catch (Exception e) {
            log.error("Toss confirm 예외: {}", e.getMessage(), e);
            throw new RuntimeException("토스페이 결제 확인 중 오류: " + e.getMessage());
        }

        Payment payment = Payment.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .impUid(req.getPaymentKey())
            .merchantUid(req.getOrderId())
            .packageName(pkg.getDisplayName())
            .tokenAmount(pkg.getTokenAmount())
            .amount(pkg.getPrice())
            .payMethod("tosspay")
            .status("paid")
            .paidAt(LocalDateTime.now())
            .build();
        paymentRepository.save(payment);

        int newBalance = user.getTokenBalance() + pkg.getTokenAmount();
        user.setTokenBalance(newBalance);
        userRepository.save(user);

        tokenLogRepository.save(TokenLog.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .amount(pkg.getTokenAmount())
            .balanceAfter(newBalance)
            .type("purchase")
            .reason(pkg.getDisplayName() + " 패키지 구매 (토스페이)")
            .referenceId(payment.getId())
            .build());

        return PaymentResponse.builder()
            .success(true)
            .message("결제 완료! 토큰 " + pkg.getTokenAmount() + "개가 충전되었습니다.")
            .newTokenBalance(newBalance)
            .merchantUid(req.getOrderId())
            .build();
    }

    @SuppressWarnings("unchecked")
    private void verifyPortonePayment(String impUid, int expectedAmount) {
        if (portoneApiKey.isBlank() || portoneApiSecret.isBlank()) {
            log.warn("Portone API 키 미설정 — 결제 금액 검증 생략");
            return;
        }
        try {
            RestTemplate restTemplate = new RestTemplate();

            Map<String, String> tokenBody = new HashMap<>();
            tokenBody.put("imp_key", portoneApiKey);
            tokenBody.put("imp_secret", portoneApiSecret);

            ResponseEntity<Map> tokenRes = restTemplate.postForEntity(
                "https://api.iamport.kr/users/getToken", tokenBody, Map.class);
            String accessToken = (String) ((Map<String, Object>)
                tokenRes.getBody().get("response")).get("access_token");

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            ResponseEntity<Map> payRes = restTemplate.exchange(
                "https://api.iamport.kr/payments/" + impUid,
                HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            Map<String, Object> data = (Map<String, Object>) payRes.getBody().get("response");
            int paidAmount = ((Number) data.get("amount")).intValue();
            String status = (String) data.get("status");

            if (!"paid".equals(status) || paidAmount != expectedAmount) {
                throw new RuntimeException("결제 금액이 일치하지 않습니다.");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Portone 결제 검증 중 오류: " + e.getMessage());
        }
    }
}
