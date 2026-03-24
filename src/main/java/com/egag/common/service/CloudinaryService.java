package com.egag.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * MultipartFile 업로드
     */
    public String uploadFile(MultipartFile file, String folder) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", folder));
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("[CloudinaryService] 업로드 실패: {}", e.getMessage());
            throw new RuntimeException("이미지 업로드에 실패했습니다.");
        }
    }

    /**
     * Base64 또는 URL 문자열 업로드
     */
    public String uploadString(String data, String folder) {
        if (data == null || data.isEmpty()) return null;
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(data,
                    ObjectUtils.asMap("folder", folder));
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("[CloudinaryService] 문자열 업로드 실패: {}", e.getMessage());
            return data; // 실패 시 원본 반환 (기존 로직 유지)
        }
    }
}
