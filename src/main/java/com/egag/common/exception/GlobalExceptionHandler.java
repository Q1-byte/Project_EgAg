package com.egag.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<Map<String, Object>> handleCustomException(CustomException e) {
        return ResponseEntity.status(e.getStatus())
                .body(Map.of("error", Map.of("code", e.getCode(), "message", e.getMessage())));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        String code = e.getMessage().contains("이메일") ? "EMAIL_DUPLICATED"
                    : e.getMessage().contains("별명") ? "NICKNAME_DUPLICATED"
                    : "INVALID_ARGUMENT";
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", Map.of("code", code, "message", e.getMessage())));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        log.error("❌ 서버 오류: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", Map.of("code", "INTERNAL_ERROR", "message", e.getMessage() != null ? e.getMessage() : "서버 오류가 발생했습니다")));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("❌ 서버 오류: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", Map.of("code", "INTERNAL_ERROR", "message", "서버 오류가 발생했습니다")));
    }

    // 파일 용량 초과 시 발생하는 예외 처리
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleMaxSizeException(MaxUploadSizeExceededException e) {
        return ResponseEntity.badRequest().body("파일 용량이 너무 큽니다. (최대 5MB)");
    }

}
