package com.egag.artwork;

import com.egag.auth.PrincipalDetails;
import com.egag.artwork.dto.ArtworkResponse;
import com.egag.artwork.dto.ReportRequest;
import com.egag.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
public class ArtworkController {

    private final ArtworkService artworkService;

    @GetMapping("/{id}")
    public ArtworkResponse getArtwork(@PathVariable String id) {
        return artworkService.getArtwork(id);
    }

    @GetMapping("/explore")
    public List<ArtworkResponse> explore(
            @RequestParam(required = false, defaultValue = "latest") String sort,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "10") int limit) {
        return artworkService.explore(sort, cursor, limit);
    }

    @PostMapping("/{id}/like")
    public void toggleLike(@PathVariable String id, @AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        artworkService.toggleLike(id, principal.getUserId());
    }

    @DeleteMapping("/{id}")
    public void deleteArtwork(@PathVariable String id, @AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        artworkService.deleteArtwork(id, principal.getUserId());
    }

    @PatchMapping("/{id}/public")
    public void togglePublic(@PathVariable String id, @AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        artworkService.togglePublic(id, principal.getUserId());
    }

    @PostMapping("/{id}/report")
    public void reportArtwork(@PathVariable String id, @AuthenticationPrincipal PrincipalDetails principal, @RequestBody ReportRequest request) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        artworkService.reportArtwork(id, principal.getUserId(), request);
    }
}
