package com.egag.user;

import com.egag.common.domain.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserProfileResponse {
    private final String id;
    private final String email;
    private final String subEmail;
    private final String name;
    private final String nickname;
    private final String phone;
    private final String profileImageUrl;
    private final int tokenBalance;
    private final int followerCount;
    private final int followingCount;
    private final String provider;
    private final LocalDateTime createdAt;

    public UserProfileResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.subEmail = user.getSubEmail();
        this.name = user.getName();
        this.nickname = user.getNickname();
        this.phone = user.getPhone();
        this.profileImageUrl = user.getProfileImageUrl();
        this.tokenBalance = user.getTokenBalance() != null ? user.getTokenBalance() : 0;
        this.followerCount = user.getFollowerCount() != null ? user.getFollowerCount() : 0;
        this.followingCount = user.getFollowingCount() != null ? user.getFollowingCount() : 0;
        this.provider = user.getProvider();
        this.createdAt = user.getCreatedAt();
    }
}
