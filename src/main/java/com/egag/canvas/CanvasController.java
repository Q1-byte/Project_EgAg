package com.egag.canvas;

import com.egag.common.domain.User;
import com.egag.common.domain.UserRepository;
import com.egag.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/canvas")
@RequiredArgsConstructor
public class CanvasController {

    private final ImageTransformService imageTransformService;
    private final CanvasService canvasService;
    private final UserRepository userRepository;

    @PostMapping("/start")
    public ResponseEntity<StartSessionResponse> startSession(@RequestBody StartSessionRequest request) {
        return ResponseEntity.ok(canvasService.startSession(request.getNickname()));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<CompleteResponse> complete(@PathVariable String id,
                                                      @RequestBody CompleteRequest request) {
        return ResponseEntity.ok(canvasService.complete(request.getCanvasBase64()));
    }

    @PostMapping("/identify")
    public ResponseEntity<Map<String, String>> identify(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(imageTransformService.identifySubject(body.get("canvasBase64")));
    }

    @PostMapping("/transform")
    public ResponseEntity<TransformResponse> transform(
            @RequestBody TransformRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED", "로그인이 필요합니다.");
        }

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        if (user.getTokenBalance() < 1) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "INSUFFICIENT_TOKEN", "토큰이 부족합니다.");
        }

        user.setTokenBalance(user.getTokenBalance() - 1);
        userRepository.save(user);

        TransformResponse result = imageTransformService.transform(
                request.getCanvasBase64(), request.getStyle(), request.getSubject(), request.getReason());

        return ResponseEntity.ok(TransformResponse.builder()
                .imageUrl(result.getImageUrl())
                .prompt(result.getPrompt())
                .style(result.getStyle())
                .story(result.getStory())
                .tokenBalance(user.getTokenBalance())
                .build());
    }
}
