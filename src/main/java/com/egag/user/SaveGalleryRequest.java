package com.egag.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SaveGalleryRequest {
    private String aiImageUrl;
    private String style;
    private String story;
    private String subject;
    private String type; // CANVAS or DECALCOMANIA
}
