package com.egag.common.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    Optional<User> findBySubEmail(String subEmail);
    boolean existsBySubEmail(String subEmail);
    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    @Query("SELECT u FROM User u WHERE u.nickname LIKE %:keyword% OR u.email LIKE %:keyword%")
    List<User> searchByKeyword(@Param("keyword") String keyword);

    // 📊 오늘 가입자 수 조회 (정상 작동)
    long countByCreatedAtAfter(LocalDateTime date);

    // 🚫 [수정] status 대신 isSuspended 필드를 사용하도록 변경
    long countByIsSuspended(Boolean isSuspended);

    @Modifying
    @Query("UPDATE User u SET u.followerCount = u.followerCount + 1 WHERE u.id = :id")
    void incrementFollowerCount(@Param("id") String id);

    @Modifying
    @Query("UPDATE User u SET u.followerCount = CASE WHEN u.followerCount > 0 THEN u.followerCount - 1 ELSE 0 END WHERE u.id = :id")
    void decrementFollowerCount(@Param("id") String id);

    @Modifying
    @Query("UPDATE User u SET u.followingCount = u.followingCount + 1 WHERE u.id = :id")
    void incrementFollowingCount(@Param("id") String id);

    @Modifying
    @Query("UPDATE User u SET u.followingCount = CASE WHEN u.followingCount > 0 THEN u.followingCount - 1 ELSE 0 END WHERE u.id = :id")
    void decrementFollowingCount(@Param("id") String id);
}