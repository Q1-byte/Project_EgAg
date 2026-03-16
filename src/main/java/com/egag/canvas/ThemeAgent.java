package com.egag.canvas;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ThemeAgent {

    private final OpenAiClient openAiClient;

    private static final String SYSTEM_PROMPT = """
            너는 사용자가 그린 첫 획을 보고 어울리는 주제를 제안하는 AI야.
            응답은 반드시 JSON 형식으로:
            { "suggestions": ["주제1", "주제2", "주제3"] }
            - 한국어로 짧고 재미있는 주제 3개를 제안해줘.
            """;

    public String suggestTopics(String canvasBase64) {
        List<ChatMessage> messages = List.of(
                SystemMessage.from(SYSTEM_PROMPT),
                UserMessage.from(
                        ImageContent.from(canvasBase64, "image/png"),
                        TextContent.from("이 그림에 어울리는 주제 3개를 제안해줘.")
                )
        );
        return openAiClient.chat(messages);
    }
}
