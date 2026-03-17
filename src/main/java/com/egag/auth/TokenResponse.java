package com.egag.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
public class TokenResponse {

    private final String accessToken;
    private final String refreshToken;
    private final String tokenType = "Bearer";
    private final String userId;
    private final String nickname;
    private final int tokenBalance;

    public TokenResponse(String accessToken, String refreshToken,
                         String userId, String nickname, int tokenBalance) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.nickname = nickname;
        this.tokenBalance = tokenBalance;
    }
}