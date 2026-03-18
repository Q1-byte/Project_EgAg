package com.egag.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/auth/kakao")
@RequiredArgsConstructor
public class KakaoAuthController {

    private final KakaoAuthService kakaoAuthService;

    @Value("${app.base-url}")
    private String appBaseUrl;

    /**
     * 카카오 로그인 시작 - 카카오 OAuth 인증 페이지로 리다이렉트
     * GET /api/auth/kakao
     */
    @GetMapping
    public RedirectView kakaoLogin() {
        return new RedirectView(kakaoAuthService.getAuthorizationUrl());
    }

    /**
     * 카카오 OAuth 콜백 - 인가 코드로 토큰 발급 후 프론트엔드로 리다이렉트
     * GET /api/auth/kakao/callback?code=...
     */
    @GetMapping("/callback")
    public RedirectView kakaoCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error) {
        log.info("카카오 콜백 수신 - code: {}, error: {}", code != null ? "있음" : "없음", error);
        if (error != null || code == null) {
            log.error("카카오 인증 실패, error: {}", error);
            return new RedirectView(appBaseUrl + "/login?error=kakao_failed");
        }
        try {
            TokenResponse token = kakaoAuthService.kakaoLogin(code);
            log.info("카카오 로그인 성공, userId: {}, nickname: {}", token.getUserId(), token.getNickname());
            String redirectUrl = appBaseUrl + "/oauth/callback"
                    + "?accessToken=" + token.getAccessToken()
                    + "&refreshToken=" + token.getRefreshToken()
                    + "&userId=" + token.getUserId()
                    + "&nickname=" + URLEncoder.encode(token.getNickname(), StandardCharsets.UTF_8)
                    + "&tokenBalance=" + token.getTokenBalance();
            return new RedirectView(redirectUrl);
        } catch (Exception e) {
            log.error("카카오 로그인 실패: {}", e.getMessage(), e);
            RedirectView view = new RedirectView(appBaseUrl + "/login?error=kakao_failed");
            view.setStatusCode(HttpStatus.FOUND);
            return view;
        }
    }
}
