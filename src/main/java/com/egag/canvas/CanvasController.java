package com.egag.canvas;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/canvas")
@RequiredArgsConstructor
public class CanvasController {

    private final ImageTransformService imageTransformService;
    private final CanvasService canvasService;

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
    public ResponseEntity<TransformResponse> transform(@RequestBody TransformRequest request) {
        return ResponseEntity.ok(imageTransformService.transform(
                request.getCanvasBase64(), request.getStyle(), request.getSubject(), request.getReason()));
    }
}
