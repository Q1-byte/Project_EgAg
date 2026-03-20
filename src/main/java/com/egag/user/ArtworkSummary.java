package com.egag.user;

import com.egag.common.domain.Artwork;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ArtworkSummary {
    private final String id;
    private final String title;
    private final String topic;
    private final String imageUrl;
    private final String userImageData;
    private final String status;
    @JsonProperty("isPublic")
    private final boolean isPublic;
    private final int likeCount;
    private final LocalDateTime createdAt;

    public ArtworkSummary(Artwork artwork) {
        this.id = artwork.getId();
        this.title = artwork.getTitle();
        this.topic = artwork.getTopic();
        this.imageUrl = artwork.getImageUrl();
        this.userImageData = artwork.getUserImageData();
        this.status = artwork.getStatus();
        this.isPublic = artwork.getIsPublic();
        this.likeCount = artwork.getLikeCount();
        this.createdAt = artwork.getCreatedAt();
    }
}
