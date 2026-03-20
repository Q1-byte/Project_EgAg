package com.egag.artwork;

import com.egag.user.ArtworkSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
public class ArtworkController {

    private final ArtworkService artworkService;

    /** 갤러리에 저장 */
    @PostMapping
    public ResponseEntity<ArtworkSummary> save(Authentication auth, @RequestBody SaveArtworkRequest req) {
        return ResponseEntity.ok(artworkService.saveToGallery(auth.getName(), req));
    }

    /** 공개/비공개 토글 */
    @PatchMapping("/{id}/visibility")
    public ResponseEntity<ArtworkSummary> toggleVisibility(Authentication auth, @PathVariable String id) {
        return ResponseEntity.ok(artworkService.toggleVisibility(auth.getName(), id));
    }

    /** 내 갤러리에서 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable String id) {
        artworkService.deleteArtwork(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
