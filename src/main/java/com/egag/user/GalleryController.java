package com.egag.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    /** 공개 갤러리 - 공개된 모든 작품 반환 */
    @GetMapping("/public")
    public ResponseEntity<List<ArtworkSummary>> getPublicArtworks() {
        return ResponseEntity.ok(galleryService.getPublicArtworks());
    }
}
