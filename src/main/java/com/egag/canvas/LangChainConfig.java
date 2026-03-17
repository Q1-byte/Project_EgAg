package com.egag.canvas;

import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LangChainConfig {

    @Value("${openai.api-key}")
    private String apiKey;

    @Bean
    StoryTeller storyTeller() {
        var model = OpenAiChatModel.builder()
                .apiKey(apiKey)
                .modelName("gpt-4o-mini")
                .build();
        return AiServices.builder(StoryTeller.class)
                .chatLanguageModel(model)
                .build();
    }
}
