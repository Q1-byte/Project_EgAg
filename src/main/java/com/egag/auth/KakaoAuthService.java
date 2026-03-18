package com.egag.auth;

import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoAuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${kakao.client-id}")
    private String clientId;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpiration;

    public String getAuthorizationUrl() {
        return "https://kauth.kakao.com/oauth/authorize"
                + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code";
    }

    @Transactional
    public TokenResponse kakaoLogin(String code) {
        String kakaoAccessToken = exchangeCodeForToken(code);
        Map<String, Object> userInfo = fetchUserInfo(kakaoAccessToken);
        User user = findOrCreateUser(userInfo);
        return generateTokenPair(user);
    }

    @SuppressWarnings("unchecked")
    private String exchangeCodeForToken(String code) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://kauth.kakao.com/oauth/token",
                new HttpEntity<>(params, headers),
                Map.class
        );

        return (String) response.getBody().get("access_token");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchUserInfo(String kakaoAccessToken) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(kakaoAccessToken);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        return response.getBody();
    }

    @SuppressWarnings("unchecked")
    private User findOrCreateUser(Map<String, Object> userInfo) {
        String providerId = String.valueOf(userInfo.get("id"));

        // 기존 카카오 유저 조회
        return userRepository.findByProviderAndProviderId("kakao", providerId)
                .orElseGet(() -> createKakaoUser(providerId, userInfo));
    }

    @SuppressWarnings("unchecked")
    private User createKakaoUser(String providerId, Map<String, Object> userInfo) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
        Map<String, Object> profile = kakaoAccount != null
                ? (Map<String, Object>) kakaoAccount.get("profile") : null;

        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        if (email == null) {
            email = "kakao_" + providerId + "@kakao.local";
        }

        // 이미 이 이메일로 가입한 경우 provider 정보 업데이트
        if (userRepository.existsByEmail(email)) {
            User existing = userRepository.findByEmail(email).get();
            existing.setProvider("kakao");
            existing.setProviderId(providerId);
            return userRepository.save(existing);
        }

        String rawNickname = profile != null ? (String) profile.get("nickname") : null;
        String nickname = resolveUniqueNickname(rawNickname, providerId);

        String profileImageUrl = profile != null ? (String) profile.get("profile_image_url") : null;

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .email(email)
                .nickname(nickname)
                .provider("kakao")
                .providerId(providerId)
                .profileImageUrl(profileImageUrl)
                .build();

        return userRepository.save(user);
    }

    private String resolveUniqueNickname(String rawNickname, String providerId) {
        String base = (rawNickname != null && !rawNickname.isBlank())
                ? rawNickname : "user";

        // 12자 초과 시 자르기
        if (base.length() > 10) {
            base = base.substring(0, 10);
        }

        String nickname = base;
        if (!userRepository.existsByNickname(nickname)) {
            return nickname;
        }

        // 중복이면 숫자 접미사 추가
        for (int i = 0; i < 100; i++) {
            String candidate = base + i;
            if (candidate.length() > 12) {
                candidate = base.substring(0, 12 - String.valueOf(i).length()) + i;
            }
            if (!userRepository.existsByNickname(candidate)) {
                return candidate;
            }
        }

        // 최후 수단: UUID 앞 8자
        return providerId.length() >= 8 ? providerId.substring(0, 8) : providerId;
    }

    private TokenResponse generateTokenPair(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());

        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElse(new RefreshToken());
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenExpiration));
        refreshTokenRepository.save(refreshToken);

        return new TokenResponse(accessToken, refreshToken.getToken(),
                user.getId(), user.getNickname(), user.getTokenBalance());
    }
}
