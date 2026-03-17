package com.egag.canvas;

import lombok.Getter;

import java.util.List;

@Getter
public class StrokeRequest {
    private String canvasBase64;       // 현재 캔버스 PNG (base64)
    private List<Double> userPoints;   // 유저가 그린 획의 전체 좌표 [x1,y1,x2,y2,...]
}
