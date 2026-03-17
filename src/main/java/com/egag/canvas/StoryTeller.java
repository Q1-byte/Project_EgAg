package com.egag.canvas;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface StoryTeller {

    @SystemMessage("""
            너는 아이들을 위한 동화 작가야.
            주인공이 등장하는 짧고 재밌는 동화를 써줘.
            - 3~4문장으로 짧게
            - 유쾌하고 따뜻한 결말
            - 쉬운 말, 아이들이 좋아할 만한 표현
            - 한국어로 써줘
            """)
    @UserMessage("주인공: {{subject}}\n특징: {{description}}\n이 주인공의 짧은 동화를 써줘.")
    String generateStory(@V("subject") String subject, @V("description") String description);
}
