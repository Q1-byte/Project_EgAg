package com.egag.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, String> {
    Optional<Follow> findByFollowerIdAndFollowingId(String followerId, String followingId);
    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);
    void deleteByFollowerIdAndFollowingId(String followerId, String followingId);
    // 나를 팔로우하는 사람들 (팔로워)
    List<Follow> findByFollowingId(String followingId);
    // 내가 팔로우하는 사람들 (팔로잉)
    List<Follow> findByFollowerId(String followerId);
}
