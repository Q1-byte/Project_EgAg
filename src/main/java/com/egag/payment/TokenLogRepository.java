package com.egag.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TokenLogRepository extends JpaRepository<TokenLog, String> {
    List<TokenLog> findAllByOrderByCreatedAtDesc();
}
