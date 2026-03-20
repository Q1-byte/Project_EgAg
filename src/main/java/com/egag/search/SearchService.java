package com.egag.search;

import com.egag.artwork.dto.ArtworkResponse;
import com.egag.common.domain.Artwork;
import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.search.dto.SearchResponse;
import com.egag.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ArtworkRepository artworkRepository;
    private final UserRepository userRepository;

    public SearchResponse search(String query, String type) {
        List<ArtworkResponse> artworks = null;
        List<UserResponse> users = null;

        if (type == null || type.equals("artworks") || type.equals("all")) {
            artworks = artworkRepository.findByTitleContainingIgnoreCaseAndIsPublicTrue(query).stream()
                    .map(this::convertToArtworkResponse)
                    .collect(Collectors.toList());
        }

        if (type == null || type.equals("users") || type.equals("all")) {
            users = userRepository.findByNicknameContainingIgnoreCase(query).stream()
                    .map(this::convertToUserResponse)
                    .collect(Collectors.toList());
        }

        return SearchResponse.builder()
                .artworks(artworks != null ? artworks : List.of())
                .users(users != null ? users : List.of())
                .build();
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

    private UserResponse convertToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .followerCount(user.getFollowerCount())
                .followingCount(user.getFollowingCount())
                .build();
    }
}
