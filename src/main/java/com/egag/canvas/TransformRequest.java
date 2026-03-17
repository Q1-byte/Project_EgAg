package com.egag.canvas;

import lombok.Getter;

@Getter
public class TransformRequest {
    private String canvasBase64;
    private String style; // watercolor | cartoon | oil_painting | pencil_sketch
    private String subject; // 유저가 확인한 그림 정체
    private String reason;  // AI가 식별 시 관찰한 특징
}
