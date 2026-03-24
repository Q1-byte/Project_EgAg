package com.egag.common.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ArtworkRepository extends JpaRepository<Artwork, String> {
    List<Artwork> findByUserIdAndIsPublicTrue(String userId);
    List<Artwork> findByUserId(String userId);
    List<Artwork> findByUserIdAndStatus(String userId, String status);
    List<Artwork> findAllByIsPublicTrue();
    List<Artwork> findByUserIdAndIsPublicTrueAndStatus(String userId, String status);
    List<Artwork> findByIsPublicTrueOrderByCreatedAtDesc();
    List<Artwork> findByIsPublicTrueOrderByLikeCountDesc();
    List<Artwork> findByTitleContainingIgnoreCaseAndIsPublicTrue(String title);

    // 날짜별 이미지 생성 수 (최근 N일)
    @Query(value = "SELECT DATE(created_at) as date, COUNT(*) as count FROM artworks WHERE created_at >= :since GROUP BY DATE(created_at) ORDER BY DATE(created_at)", nativeQuery = true)
    List<Object[]> countByDateSince(@Param("since") LocalDateTime since);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Artwork a SET a.likeCount = a.likeCount + 1 WHERE a.id = :id")
    void incrementLikeCount(@Param("id") String id);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Artwork a SET a.likeCount = CASE WHEN a.likeCount > 0 THEN a.likeCount - 1 ELSE 0 END WHERE a.id = :id")
    void decrementLikeCount(@Param("id") String id);
}
