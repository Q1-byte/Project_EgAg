package com.egag.canvas;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CompleteResponse {
    private String guess; // AI가 맞춘 그림 설명
}
