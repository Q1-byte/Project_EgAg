package com.egag.canvas;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class CanvasService {

    private final ImageTransformService imageTransformService;

    private static final List<String> TOPICS = List.of(
            "나비", "하트", "꽃", "얼굴", "왕관", "별", "크리스마스트리", "로켓", "문어", "부엉이",
            "고양이", "강아지", "물고기", "집", "무지개", "케이크", "펭귄", "토끼"
    );

    public StartSessionResponse startSession(String nickname) {
        String id = UUID.randomUUID().toString();
        String topic = TOPICS.get(ThreadLocalRandom.current().nextInt(TOPICS.size()));
        return StartSessionResponse.builder()
                .id(id)
                .topic(topic)
                .message((nickname != null ? nickname : "게스트") + "님, 세션이 시작되었습니다!")
                .build();
    }

    public CompleteResponse complete(String canvasBase64) {
        Map<String, String> result = imageTransformService.identifySubject(canvasBase64);
        String subject = result.getOrDefault("subject", "멋진 그림");
        String reason = result.getOrDefault("reason", "");
        String guess = reason.isBlank() ? subject : subject + "\n" + reason;
        return CompleteResponse.builder()
                .guess(guess)
                .build();
    }
}
