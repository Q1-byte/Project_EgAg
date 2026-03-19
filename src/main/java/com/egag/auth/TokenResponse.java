package com.egag.auth;

import lombok.Getter;

@Getter
public class TokenResponse {

    private final String accessToken;
    private final String refreshToken;
    private final String tokenType = "Bearer";
    private final String userId;
    private final String nickname;
    private final String role; // ✅ 1. role 필드 추가
    private final int tokenBalance;
    private final boolean needsOnboarding;

    // ✅ 2. 생성자에도 role 파라미터 추가
    public TokenResponse(String accessToken, String refreshToken,
                         String userId, String nickname, String role, int tokenBalance) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.nickname = nickname;
        this.role = role; // ✅ 3. 값 할당
        this.tokenBalance = tokenBalance;
        this.needsOnboarding = false;
    }

    public TokenResponse(String accessToken, String refreshToken,
                         String userId, String nickname, int tokenBalance, boolean needsOnboarding) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.nickname = nickname;
        this.tokenBalance = tokenBalance;
        this.needsOnboarding = needsOnboarding;
    }
}