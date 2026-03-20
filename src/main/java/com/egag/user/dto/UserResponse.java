package com.egag.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String email;
    private String nickname;
    private String profileImageUrl;
    private int tokenBalance;
    private int followerCount;
    private int followingCount;
    private boolean isFollowing;
}
