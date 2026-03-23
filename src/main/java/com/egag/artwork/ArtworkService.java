package com.egag.artwork;

import com.egag.admin.Report;
import com.egag.admin.ReportRepository;
import com.egag.artwork.dto.ArtworkResponse;
import com.egag.artwork.dto.ReportRequest;
import com.egag.common.domain.Artwork;
import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.common.exception.CustomException;
import com.egag.notification.NotificationRepository;
import com.egag.notification.NotificationService;
import com.egag.user.ArtworkSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtworkService {

    private final ArtworkRepository artworkRepository;
    private final LikeRepository likeRepository;
    private final ReportRepository reportRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ── 내 갤러리에 저장 (email 기반) ──────────────────────────
    @Transactional
    public ArtworkSummary saveToGallery(String email, SaveArtworkRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        String savedImageUrl = downloadAndSave(req.getImageUrl());

        Artwork artwork = Artwork.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .title(req.getTitle())
                .topic(req.getSource())
                .imageUrl(savedImageUrl)
                .userImageData(req.getUserImageData())
                .strokeData("{}")
                .status("completed")
                .isPublic(true)
                .build();

        return new ArtworkSummary(artworkRepository.save(artwork));
    }

    // ── 공개/비공개 토글 (email 기반, ArtworkSummary 반환) ──────
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

    // ── 삭제 (userId 기반) ──────────────────────────────────────
    @Transactional
    public void deleteArtwork(String artworkId, String userId) {
        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));

        if (!artwork.getUser().getId().equals(userId)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "PERMISSION_DENIED", "삭제 권한이 없습니다.");
        }

        likeRepository.deleteByArtworkId(artworkId);
        reportRepository.deleteByArtworkId(artworkId);
        notificationRepository.deleteByArtworkId(artworkId);
        artworkRepository.delete(artwork);
    }

    private String downloadAndSave(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("http")) return imageUrl;
        try {
            Path dir = Paths.get("uploads/artworks");
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + ".png";
            Path dest = dir.resolve(filename);
            try (InputStream in = new URL(imageUrl).openStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
            return "/uploads/artworks/" + filename;
        } catch (Exception e) {
            System.err.println("[downloadAndSave] 실패: " + e.getMessage());
            return imageUrl;
        }
    }

    // ── 공개/비공개 토글 (userId 기반, void) ───────────────────
    @Transactional
    public void togglePublic(String artworkId, String userId) {
        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));

        if (!artwork.getUser().getId().equals(userId)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "PERMISSION_DENIED", "권한이 없습니다.");
        }

        artwork.setIsPublic(!artwork.getIsPublic());
        artworkRepository.save(artwork);
    }

    @Transactional
    public void reportArtwork(String artworkId, String reporterId, ReportRequest request) {
        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        if (reportRepository.existsByReporterIdAndArtworkId(reporterId, artworkId)) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "ALREADY_REPORTED", "이미 신고한 작품입니다.");
        }

        Report report = Report.builder()
                .id(UUID.randomUUID().toString())
                .reporter(reporter)
                .artwork(artwork)
                .reason(request.getReason())
                .description(request.getDescription())
                .status("pending")
                .build();

        reportRepository.save(report);
    }

    public ArtworkResponse getArtwork(String id) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));
        return convertToResponse(artwork);
    }

    public List<ArtworkResponse> explore(String sort, String cursor, int limit) {
        List<Artwork> artworks;
        if ("popular".equals(sort)) {
            artworks = artworkRepository.findByIsPublicTrueOrderByLikeCountDesc();
        } else {
            artworks = artworkRepository.findByIsPublicTrueOrderByCreatedAtDesc();
        }

        return artworks.stream()
                .limit(limit)
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private ArtworkResponse convertToResponse(Artwork artwork) {
        return ArtworkResponse.builder()
                .id(artwork.getId())
                .userId(artwork.getUser().getId())
                .userNickname(artwork.getUser().getNickname())
                .title(artwork.getTitle())
                .topic(artwork.getTopic())
                .imageUrl(artwork.getImageUrl())
                .userImageData(artwork.getUserImageData())
                .status(artwork.getStatus())
                .isPublic(artwork.getIsPublic())
                .likeCount(artwork.getLikeCount())
                .turnCount(artwork.getTurnCount())
                .createdAt(artwork.getCreatedAt())
                .completedAt(artwork.getCompletedAt())
                .build();
    }

    // ── 제목 수정 ────────────────────────────────────────────────
    @Transactional
    public void updateTitle(String artworkId, String userId, String title) {
        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));
        if (!artwork.getUser().getId().equals(userId)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "PERMISSION_DENIED", "권한이 없습니다.");
        }
        artwork.setTitle(title);
        artworkRepository.save(artwork);
    }

    @Transactional
    public void toggleLike(String artworkId, String userId) {
        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "ARTWORK_NOT_FOUND", "작품을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        Optional<Like> existingLike = likeRepository.findByUserIdAndArtworkId(userId, artworkId);

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            artwork.setLikeCount(Math.max(0, artwork.getLikeCount() - 1));
        } else {
            Like newLike = Like.builder()
                    .id(UUID.randomUUID().toString())
                    .user(user)
                    .artwork(artwork)
                    .build();
            likeRepository.save(newLike);
            artwork.setLikeCount(artwork.getLikeCount() + 1);
            notificationService.createLikeNotification(artwork.getUser(), user, artwork);
        }
        artworkRepository.save(artwork);
    }
}
