package com.egag.canvas;

import com.egag.common.exception.CustomException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImageTransformService {

    private final ObjectMapper objectMapper;
    private final StoryTeller storyTeller;

    @Value("${openai.api-key}")
    private String apiKey;

    private static final String VISION_MODEL = "gpt-4o";

    private static final Map<String, String> STYLE_PROMPTS = Map.of(
            "watercolor", "watercolor painting style, soft wet brushstrokes, flowing colors that bleed into each other, white paper showing through, translucent layers, artistic and dreamy atmosphere, delicate and fluid",
            "cartoon", "cartoon illustration style, clean bold black outlines, flat bright colors, cute and expressive, 2D animated look, similar to modern animated movies, simple but charming",
            "oil_painting", "oil painting style, thick impasto brushstrokes, rich saturated colors, dramatic lighting and shadows, classical fine art composition, painterly texture, museum quality",
            "pencil_sketch", "detailed pencil sketch style, fine graphite lines, realistic cross-hatching shading, subtle tonal gradients, clean white background, professional illustration quality"
    );

    private static final Map<String, String> STYLE_NAMES = Map.of(
            "watercolor", "수채화",
            "cartoon", "카툰",
            "oil_painting", "유화",
            "pencil_sketch", "연필 스케치"
    );

    public Map<String, String> identifySubject(String canvasBase64) {
        String systemPrompt = """
                너는 그림을 보고 뭔지 맞히는 AI야.
                반드시 아래 JSON 형식으로만 답해. 다른 말은 하지 마.
                {"subject":"정답(1~3단어, 한국어)","reason":"추측 이유(한국어, 2~3문장)"}
                '그림', '스케치', '이미지' 같은 단어는 subject에 붙이지 마.
                """;
        String userPrompt = """
                이 그림이 뭔지 맞혀봐.
                reason에는 어떤 시각적 특징을 보고 그렇게 생각했는지 구체적으로 써줘.
                예: 몸통 모양, 다리 개수, 꼬리 형태, 머리 생김새, 특징적인 부위 등을 언급해줘.
                아이들이 읽을 거니까 친근하고 재밌게 써줘.
                """;
        String raw = callVisionApi(canvasBase64, systemPrompt, userPrompt).trim();
        try {
            JsonNode node = objectMapper.readTree(raw);
            String subject = node.path("subject").asText().replaceAll("[.。!?]+$", "").trim();
            String reason = node.path("reason").asText().trim();
            return Map.of("subject", subject, "reason", reason);
        } catch (Exception e) {
            return Map.of("subject", raw.replaceAll("[.。!?]+$", "").trim(), "reason", "");
        }
    }

    public TransformResponse transform(String canvasBase64, String style, String subject, String reason) {
        // subject가 없으면 새로 식별, 있으면 재사용
        String resolvedSubject = (subject != null && !subject.isBlank()) ? subject : identifySubject(canvasBase64).get("subject");
        System.out.println("[DEBUG] subject: " + resolvedSubject);

        String description = describeSketch(canvasBase64, resolvedSubject, reason);
        System.out.println("[DEBUG] description: " + description);

        String stylePrompt = STYLE_PROMPTS.getOrDefault(style, STYLE_PROMPTS.get("watercolor"));
        String prompt = String.format(
                "%s. Art style: %s. High quality, visually appealing, well-composed image.",
                description, stylePrompt
        );

        String imageUrl = generateImage(prompt);
        String story = storyTeller.generateStory(resolvedSubject, description);
        System.out.println("[STORY] " + story);

        return TransformResponse.builder()
                .imageUrl(imageUrl)
                .prompt(prompt)
                .style(STYLE_NAMES.getOrDefault(style, style))
                .story(story)
                .build();
    }

    private String describeSketch(String canvasBase64, String subject, String reason) {
        String reasonHint = (reason != null && !reason.isBlank())
                ? "Visual features already observed (use these as anchor): " + reason + "\n" : "";
        String systemPrompt = """
                You are a world-class image prompt engineer specializing in children's illustration.
                Your output will be used directly as a DALL-E 3 prompt.
                Always respond in English only. Be specific, vivid, and detailed.
                """;
        String userPrompt = String.format("""
                Subject: %s
                %s
                Study this drawing carefully and write a rich, detailed DALL-E 3 prompt that captures:

                1. SUBJECT SPECIFICS: exact body shape, proportions, distinguishing anatomy
                   (e.g. "a plump round body", "a long slender neck", "a tightly coiled tail")
                2. POSE & ORIENTATION: direction it faces, posture, movement
                3. KEY DETAILS: eyes, fins/limbs/wings, texture, patterns, notable features
                4. COMPOSITION: placement on canvas, background suggestion if any
                5. MOOD: cute, fierce, gentle, playful, etc. — matching the drawing's character

                Critical: Describe THIS specific drawing, not a generic %s.
                Output 3-4 detailed sentences. Do not mention sketch or drawing.
                """, subject, reasonHint, subject);
        return callVisionApi(canvasBase64, systemPrompt, userPrompt).trim();
    }

    private String callVisionApi(String canvasBase64, String systemPrompt, String userPrompt) {
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl("https://api.openai.com")
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .build();

            Map<String, Object> imageUrl = Map.of(
                    "url", "data:image/png;base64," + canvasBase64,
                    "detail", "high"
            );
            Map<String, Object> imageContent = Map.of("type", "image_url", "image_url", imageUrl);
            Map<String, Object> textContent = Map.of("type", "text", "text", userPrompt);

            List<Map<String, Object>> messages = List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", List.of(imageContent, textContent))
            );

            String body = objectMapper.writeValueAsString(Map.of(
                    "model", VISION_MODEL,
                    "messages", messages,
                    "max_tokens", 500
            ));

            String response = restClient.post()
                    .uri("/v1/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode node = objectMapper.readTree(response);
            String result = node.path("choices").get(0).path("message").path("content").asText();
            System.out.println("[VISION] prompt: " + userPrompt.strip());
            System.out.println("[VISION] response: " + result);
            return result;
        } catch (Exception e) {
            System.out.println("[VISION] error: " + e.getMessage());
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "VISION_ERROR",
                    "이미지 분석 실패: " + e.getMessage());
        }
    }

    private String generateImage(String prompt) {
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl("https://api.openai.com")
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .build();

            String body = objectMapper.writeValueAsString(Map.of(
                    "model", "dall-e-3",
                    "prompt", prompt,
                    "n", 1,
                    "size", "1024x1024",
                    "quality", "standard"
            ));

            String response = restClient.post()
                    .uri("/v1/images/generations")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            System.out.println("[DALLE] response: " + response);
            JsonNode node = objectMapper.readTree(response);
            return node.path("data").get(0).path("url").asText();
        } catch (Exception e) {
            System.out.println("[DALLE] error: " + e.getMessage());
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "DALLE_ERROR",
                    "이미지 생성 실패: " + e.getMessage());
        }
    }
}
