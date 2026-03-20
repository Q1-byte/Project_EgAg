package com.egag.artwork;

import lombok.Getter;

@Getter
public class SaveArtworkRequest {
    private String imageUrl;       // AI가 그린 그림 URL
    private String userImageData;  // 유저가 그린 그림 base64 (data:image/png;base64,...)
    private String title;
    private String source;         // "canvas" | "decalcomania"
}
