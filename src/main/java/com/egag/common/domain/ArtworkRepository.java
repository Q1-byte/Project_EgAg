package com.egag.common.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArtworkRepository extends JpaRepository<Artwork, String> {
    List<Artwork> findByUserIdAndIsPublicTrue(String userId);
    List<Artwork> findByUserId(String userId);
    List<Artwork> findByUserIdAndStatus(String userId, String status);
    List<Artwork> findAllByIsPublicTrue();
}
