package com.egag.canvas;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StartSessionResponse {
    private String id;
    private String topic;
    private String message;
}
