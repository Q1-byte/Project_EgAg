package com.egag.canvas;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.data.message.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenAiClient {

    private final ChatLanguageModel chatLanguageModel;

    public String chat(List<ChatMessage> messages) {
        return chatLanguageModel.chat(messages).aiMessage().text();
    }
}
