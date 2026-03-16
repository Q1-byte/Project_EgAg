package com.egag.canvas;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class StrokeAgent {

    private final OpenAiClient openAiClient;

    private static final String SYSTEM_PROMPT = """
            너는 사용자와 1획씩 번갈아 그림을 완성하는 AI 화가야.
            사용자가 그린 캔버스 이미지를 보고 다음 1획을 그려줘.
            응답은 반드시 JSON 형식으로:
            { "points": [x1,y1,x2,y2,...], "comment": "짧은 코멘트", "done": false }
            - points: 획의 좌표 배열 (캔버스 800x600 기준)
            - comment: 사용자에게 보여줄 짧은 격려/코멘트
            - done: 그림이 충분히 완성되었다고 판단되면 true
            """;

    public String generateStroke(String canvasBase64, List<ChatMessage> history) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(SystemMessage.from(SYSTEM_PROMPT));
        messages.addAll(history);
        messages.add(UserMessage.from(
                ImageContent.from(canvasBase64, "image/png"),
                TextContent.from("이 캔버스에 다음 1획을 그려줘.")
        ));
        return openAiClient.chat(messages);
    }
}
