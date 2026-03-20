package com.egag.artwork;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, String> {
    Optional<Like> findByUserIdAndArtworkId(String userId, String artworkId);
    boolean existsByUserIdAndArtworkId(String userId, String artworkId);
    void deleteByUserIdAndArtworkId(String userId, String artworkId);
}
