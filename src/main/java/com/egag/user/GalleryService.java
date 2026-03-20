package com.egag.user;

import com.egag.common.domain.Artwork;
import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final ArtworkRepository artworkRepository;
    private final UserRepository userRepository;

    // TODO: getMyGallery

    @Transactional
    public void saveToGallery(String email, SaveGalleryRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        String aiContext = String.format(
                "{\"style\":\"%s\",\"type\":\"%s\",\"story\":\"%s\"}",
                req.getStyle() != null ? req.getStyle().replace("\"", "'") : "",
                req.getType() != null ? req.getType() : "CANVAS",
                req.getStory() != null ? req.getStory().replace("\"", "'").replace("\n", " ") : ""
        );

        Artwork artwork = Artwork.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .title(req.getStyle() != null ? req.getStyle() : "내 작품")
                .topic(req.getSubject() != null ? req.getSubject() : "")
                .imageUrl(req.getAiImageUrl())
                .strokeData("{}")
                .aiContext(aiContext)
                .status("completed")
                .completedAt(LocalDateTime.now())
                .build();

        artworkRepository.save(artwork);
    }
}
