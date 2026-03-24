package com.egag.user;

import com.egag.auth.PrincipalDetails;
import com.egag.user.dto.UserResponse;
import com.egag.artwork.dto.ArtworkResponse;
import com.egag.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<UserProfileResponse> getMe(@AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        return ResponseEntity.ok(userService.getMe(principal.getUsername()));
    }

    /** 내 정보 수정 (닉네임, 이름, 전화번호) */
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(
            @AuthenticationPrincipal PrincipalDetails principal,
            @RequestBody UpdateProfileRequest req) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        return ResponseEntity.ok(userService.updateMe(principal.getUsername(), req));
    }

    /** 비밀번호 변경 */
    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal PrincipalDetails principal,
            @RequestBody ChangePasswordRequest req) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        userService.changePassword(principal.getUsername(), req);
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    /** 프로필 사진 업로드 */
    @PostMapping("/me/photo")
    public ResponseEntity<UserProfileResponse> uploadPhoto(
            @AuthenticationPrincipal PrincipalDetails principal,
            @RequestParam("file") MultipartFile file) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        return ResponseEntity.ok(userService.uploadProfilePhoto(principal.getUsername(), file));
    }

    /** 카카오 로그인 온보딩 (이름, 전화번호, 이메일 입력) */
    @PostMapping("/me/onboarding")
    public ResponseEntity<UserProfileResponse> completeOnboarding(
            @AuthenticationPrincipal PrincipalDetails principal,
            @RequestBody OnboardingRequest req) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        return ResponseEntity.ok(userService.completeOnboarding(principal.getUsername(), req));
    }

    /** 타 유저 프로필 조회 (상준 파트) */
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable String id, @AuthenticationPrincipal PrincipalDetails principal) {
        return userService.getUserProfile(id, principal != null ? principal.getUserId() : null);
    }

    /** 타 유저 작품 목록 조회 (상준 파트) */
    @GetMapping("/{id}/artworks")
    public List<ArtworkResponse> getUserArtworks(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "true") boolean onlyPublic,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal PrincipalDetails principal) {
        String currentUserId = (principal != null) ? principal.getUserId() : null;
        return userService.getUserArtworks(id, onlyPublic, status, currentUserId);
    }

    /** 내 갤러리 (필터링 포함 - 상준 파트) */
    @GetMapping("/me/artworks")
    public List<ArtworkResponse> getMyArtworks(
            @AuthenticationPrincipal PrincipalDetails principal,
            @RequestParam(required = false) String status) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        return userService.getUserArtworks(principal.getUserId(), false, status, principal.getUserId());
    }

    /** 닉네임 중복 체크 */
    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        boolean available = !userService.isNicknameTaken(nickname);
        return ResponseEntity.ok(Map.of("available", available));
    }

    /** 팔로우 토글 (상준 파트) */
    @PostMapping("/{id}/follow")
    public void toggleFollow(@PathVariable String id, @AuthenticationPrincipal PrincipalDetails principal) {
        if (principal == null) throw new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "로그인이 필요합니다.");
        userService.toggleFollow(principal.getUserId(), id);
    }
}
