package com.egag.admin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, String> {
    boolean existsByReporterIdAndArtworkId(String reporterId, String artworkId);
    List<Report> findByStatus(String status);
}
