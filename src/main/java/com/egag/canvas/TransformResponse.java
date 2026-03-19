package com.egag.canvas;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransformResponse {
    private String imageUrl;
    private String prompt;
    private String style;
    private String story;
    private int tokenBalance;
}
