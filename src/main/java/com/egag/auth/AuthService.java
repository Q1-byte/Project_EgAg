package com.egag.auth.service;

import com.egag.auth.LoginRequest;
import com.egag.auth.RegisterRequest;
import com.egag.auth.TokenResponse;
import com.egag.auth.RefreshToken;
import com.egag.auth.RefreshTokenRepository;
import com.egag.auth.JwtTokenProvider;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpiration; // 밀리초 단위 (예: 604800000 = 7일)

    // ─────────────────────────────────────────
    // Spring Security UserDetailsService 구현
    // ─────────────────────────────────────────

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash() != null ? user.getPasswordHash() : "")
                .roles(user.getRole() != null ? user.getRole() : "USER")
                .build();
    }

    // ─────────────────────────────────────────
    // 회원가입
    // ─────────────────────────────────────────

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        String nickname = request.getNickname();
        if (nickname.length() > 12) {
            nickname = nickname.substring(0, 12);
        }

        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 별명입니다.");
        }

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .email(request.getEmail())
                .name(request.getName())
                .phone(request.getPhone())
                .nickname(nickname)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);
        return generateTokenPair(user);
    }

    // ─────────────────────────────────────────
    // 로그인
    // ─────────────────────────────────────────

    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return generateTokenPair(user);
    }

    // ─────────────────────────────────────────
    // Access Token 재발급 (Refresh Token 사용)
    // ─────────────────────────────────────────

    @Transactional
    public TokenResponse reissue(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new RuntimeException("유효하지 않은 Refresh Token입니다."));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh Token이 만료되었습니다. 다시 로그인해주세요.");
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(refreshToken.getUser().getEmail());
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenExpiration));
        refreshTokenRepository.save(refreshToken);

        User u = refreshToken.getUser();
        return new TokenResponse(newAccessToken, refreshToken.getToken(),
                u.getId(), u.getNickname(), u.getTokenBalance());
    }

    // ─────────────────────────────────────────
    // 로그아웃 (Refresh Token 삭제)
    // ─────────────────────────────────────────

    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
        refreshTokenRepository.deleteByUser(user);
    }

    // ─────────────────────────────────────────
    // 내부 공통: 토큰 쌍 생성
    // ─────────────────────────────────────────

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
