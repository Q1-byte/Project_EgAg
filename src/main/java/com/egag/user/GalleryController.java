package com.egag.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    // TODO: getMyGallery

    @PostMapping("/save")
    public ResponseEntity<Void> saveToGallery(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SaveGalleryRequest request) {
        galleryService.saveToGallery(userDetails.getUsername(), request);
        return ResponseEntity.ok().build();
    }
}
