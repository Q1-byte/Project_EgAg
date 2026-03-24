package com.egag.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StreakClaimRepository extends JpaRepository<StreakClaim, String> {
    boolean existsByUserIdAndDays(String userId, int days);
    List<StreakClaim> findByUserId(String userId);
}
