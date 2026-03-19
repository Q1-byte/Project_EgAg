package com.egag.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** 내 프로필 조회 */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(Authentication auth) {
        return ResponseEntity.ok(userService.getMe(auth.getName()));
    }

    /** 내 정보 수정 (닉네임, 이름, 전화번호) */
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(
            Authentication auth,
            @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateMe(auth.getName(), req));
    }

    /** 비밀번호 변경 */
    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication auth,
            @RequestBody ChangePasswordRequest req) {
        userService.changePassword(auth.getName(), req);
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    /** 프로필 사진 업로드 */
    @PostMapping("/me/photo")
    public ResponseEntity<UserProfileResponse> uploadPhoto(
            Authentication auth,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadProfilePhoto(auth.getName(), file));
    }

    /** 내 갤러리 (내 작품 목록) */
    @GetMapping("/me/artworks")
    public ResponseEntity<List<ArtworkSummary>> getMyArtworks(Authentication auth) {
        return ResponseEntity.ok(userService.getMyArtworks(auth.getName()));
    }
}
