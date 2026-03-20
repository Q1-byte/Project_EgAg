package com.egag.artwork.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrokeDTO {
    private String id;
    private double[] points;
    private String color;
    private Integer strokeWidth;
    private boolean isAI;
}
