package com.egag.artwork;

import com.egag.admin.ReportRepository;
import com.egag.common.domain.Artwork;
import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.common.exception.CustomException;
import com.egag.user.ArtworkSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArtworkService {

    private final ArtworkRepository artworkRepository;
    private final LikeRepository likeRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public ArtworkSummary saveToGallery(String email, SaveArtworkRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        Artwork artwork = Artwork.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .title(req.getTitle())
                .topic(req.getSource())
                .imageUrl(req.getImageUrl())
                .userImageData(req.getUserImageData())
                .strokeData("{}")
                .status("completed")
                .isPublic(false)
                .build();

        return new ArtworkSummary(artworkRepository.save(artwork));
    }

    @Transactional
    public ArtworkSummary toggleVisibility(String email, String artworkId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));

        if (!artwork.getUser().getId().equals(user.getId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "권한이 없습니다.");
        }

        artwork.setIsPublic(!artwork.getIsPublic());
        return new ArtworkSummary(artworkRepository.save(artwork));
    }

    @Transactional
    public void deleteArtwork(String email, String artworkId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));

        if (!artwork.getUser().getId().equals(user.getId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "권한이 없습니다.");
        }

        artworkRepository.delete(artwork);
    }
}
