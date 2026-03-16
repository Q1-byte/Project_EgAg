package com.egag.canvas.config; // 패키지 경로는 프로젝트에 맞게 수정

import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LangChainConfig {

    @Value("${langchain4j.open-ai.chat-model.api-key}")
    private String apiKey;

    @Bean
    ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
                .apiKey(apiKey.equals("demo") ? "demo" : apiKey) // demo면 langchain4j 제공 키 사용
                .modelName("gpt-4o")
                .build();
    }
}