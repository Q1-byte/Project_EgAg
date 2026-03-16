package com.egag;

import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class EgagApplicationTests {

    @MockitoBean
    ChatLanguageModel chatLanguageModel;

    @Test
    void contextLoads() {
    }
}
