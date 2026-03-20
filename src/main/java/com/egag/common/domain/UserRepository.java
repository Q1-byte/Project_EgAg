package com.egag.common.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    List<User> findByNicknameContainingIgnoreCase(String query);
    Optional<User> findBySubEmail(String subEmail);
    boolean existsBySubEmail(String subEmail);
    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    // 📊 오늘 가입자 수 조회 (정상 작동)
    long countByCreatedAtAfter(LocalDateTime date);

    // 🚫 [수정] status 대신 isSuspended 필드를 사용하도록 변경
    long countByIsSuspended(Boolean isSuspended);
}