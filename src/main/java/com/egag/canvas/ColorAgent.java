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
public class ColorAgent {

    private final OpenAiClient openAiClient;

    private static final String SYSTEM_PROMPT = """
            너는 완성된 선화를 보고 색칠 영역과 색상을 제안하는 AI야.
            응답은 반드시 JSON 형식으로:
            { "colorRegions": [{ "area": "영역명", "color": "#HEX코드" }, ...] }
            - 주요 영역별로 어울리는 색상을 제안해줘.
            """;

    public String suggestColors(String canvasBase64) {
        List<ChatMessage> messages = List.of(
                SystemMessage.from(SYSTEM_PROMPT),
                UserMessage.from(
                        ImageContent.from(canvasBase64, "image/png"),
                        TextContent.from("이 선화에 어울리는 색상을 제안해줘.")
                )
        );
        return openAiClient.chat(messages);
    }
}
