package com.egag.canvas;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StrokeResponse {
    private List<Double> points; // AI 획 좌표 [x1,y1,x2,y2,...]
    private String part;         // AI가 그린 부분 (예: "머리 윤곽", "왼쪽 귀")
    private String comment;      // 어린이에게 보여줄 격려 메시지
    private boolean done;        // true면 그림 완성 판단
    private String nextUserPart; // 유저가 다음에 그려야 할 부분 힌트
}
