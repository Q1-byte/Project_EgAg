package com.egag.user;

import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.artwork.dto.ArtworkResponse;
import com.egag.user.dto.UserResponse;
import com.egag.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ArtworkRepository artworkRepository;
    private final FollowRepository followRepository;
    private final com.egag.notification.NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload-dir:uploads/profiles}")
    private String uploadDir;

    public UserProfileResponse getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return new UserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateMe(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            if (!req.getNickname().equals(user.getNickname())
                    && userRepository.existsByNickname(req.getNickname())) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(req.getNickname());
        }
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            user.setPhone(req.getPhone());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()
                && !req.getEmail().equals(user.getSubEmail())) {
            if (userRepository.existsBySubEmail(req.getEmail())) {
                throw new RuntimeException("이미 사용 중인 이메일입니다.");
            }
            user.setSubEmail(req.getEmail());
        }

        return new UserProfileResponse(userRepository.save(user));
    }

    @Transactional
    public UserProfileResponse completeOnboarding(String email, OnboardingRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            user.setPhone(req.getPhone());
        }
        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            if (!req.getNickname().equals(user.getNickname())
                    && userRepository.existsByNickname(req.getNickname())) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(req.getNickname());
        }
        // 온보딩 이메일은 subEmail에 저장 (인증용 email은 변경하지 않음)
        if (req.getEmail() != null && !req.getEmail().isBlank()
                && !req.getEmail().equals(user.getSubEmail())) {
            if (userRepository.existsBySubEmail(req.getEmail())) {
                throw new RuntimeException("이미 사용 중인 이메일입니다.");
            }
            user.setSubEmail(req.getEmail());
        }

        return new UserProfileResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (user.getPasswordHash() == null) {
            throw new RuntimeException("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        }
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("현재 비밀번호가 올바르지 않습니다.");
        }
        if (req.getNewPassword().length() < 8) {
            throw new RuntimeException("새 비밀번호는 8자 이상이어야 합니다.");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserProfileResponse uploadProfilePhoto(String email, MultipartFile file) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);

            String ext = "";
            String original = file.getOriginalFilename();
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + ext;
            Files.write(dir.resolve(filename), file.getBytes());

            user.setProfileImageUrl("/uploads/profiles/" + filename);
            return new UserProfileResponse(userRepository.save(user));
        } catch (IOException e) {
            throw new RuntimeException("사진 업로드에 실패했습니다.");
        }
    }

    public List<ArtworkResponse> getUserArtworks(String userId, boolean onlyPublic, String status) {
        List<Artwork> artworks;
        if (onlyPublic) {
            if (status != null && !status.equals("all")) {
                artworks = artworkRepository.findByUserIdAndIsPublicTrueAndStatus(userId, status);
            } else {
                artworks = artworkRepository.findByUserIdAndIsPublicTrue(userId);
            }
        } else {
            if (status != null && !status.equals("all")) {
                artworks = artworkRepository.findByUserIdAndStatus(userId, status);
            } else {
                artworks = artworkRepository.findByUserId(userId);
            }
        }
        return artworks.stream()
                .map(this::convertToArtworkResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserProfile(String userId, String currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
        
        boolean isFollowing = false;
        if (currentUserId != null) {
            isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUserId, userId);
        }

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .tokenBalance(user.getTokenBalance() != null ? user.getTokenBalance() : 0)
                .followerCount(user.getFollowerCount() != null ? user.getFollowerCount() : 0)
                .followingCount(user.getFollowingCount() != null ? user.getFollowingCount() : 0)
                .isFollowing(isFollowing)
                .build();
    }

    @Transactional
    public void toggleFollow(String followerId, String followingId) {
        if (followerId.equals(followingId)) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "CANNOT_FOLLOW_SELF", "자기 자신을 팔로우할 수 없습니다.");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "팔로워를 찾을 수 없습니다."));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "팔로우 대상을 찾을 수 없습니다."));

        Optional<Follow> existingFollow = followRepository.findByFollowerIdAndFollowingId(followerId, followingId);

        if (existingFollow.isPresent()) {
            followRepository.delete(existingFollow.get());
            follower.setFollowingCount(Math.max(0, follower.getFollowingCount() - 1));
            following.setFollowerCount(Math.max(0, following.getFollowerCount() - 1));
        } else {
            Follow follow = Follow.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .follower(follower)
                    .following(following)
                    .build();
            followRepository.save(follow);
            follower.setFollowingCount(follower.getFollowingCount() + 1);
            following.setFollowerCount(following.getFollowerCount() + 1);
            
            notificationService.createFollowNotification(following, follower); // Enabled
        }
        userRepository.save(follower);
        userRepository.save(following);
    }

    private ArtworkResponse convertToArtworkResponse(Artwork artwork) {
        return ArtworkResponse.builder()
                .id(artwork.getId())
                .userId(artwork.getUser().getId())
                .userNickname(artwork.getUser().getNickname())
                .title(artwork.getTitle())
                .topic(artwork.getTopic())
                .imageUrl(artwork.getImageUrl())
                .status(artwork.getStatus())
                .isPublic(artwork.getIsPublic())
                .likeCount(artwork.getLikeCount())
                .turnCount(artwork.getTurnCount())
                .createdAt(artwork.getCreatedAt())
                .completedAt(artwork.getCompletedAt())
                .build();
    }
}
