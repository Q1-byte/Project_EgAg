package com.egag.inquiry;

import com.egag.common.EmailService;
import com.egag.notification.NotificationService;
import com.egag.common.domain.User;
import com.egag.inquiry.dto.InquiryAdminResponse;
import com.egag.inquiry.dto.InquiryRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final com.egag.common.service.CloudinaryService cloudinaryService;

    // 허용할 확장자 리스트
    private final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif");

    @Transactional
    public void saveInquiry(InquiryRequest request, MultipartFile file, User user) {
        String attachmentUrl = null;

        if (file != null && !file.isEmpty()) {
            validateFile(file); // 확장자 및 용량 체크
            attachmentUrl = saveFile(file); // 실제 저장 및 DB용 경로 반환
        }

        String email = (request.getEmail() != null && !request.getEmail().isBlank())
                ? request.getEmail()
                : (user != null ? user.getEmail() : null);

        Inquiry inquiry = Inquiry.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .email(email)
                .category(request.getCategory())
                .title(request.getTitle())
                .content(request.getContent())
                .attachmentUrl(attachmentUrl)
                .status("pending")
                .build();

        inquiryRepository.save(inquiry);
        sendEmailSafe(inquiry);
    }

    // ── 어드민: 전체 문의 목록 ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<InquiryAdminResponse> getAdminInquiries(String status) {
        List<Inquiry> inquiries = "pending".equals(status)
                ? inquiryRepository.findByStatusOrderByCreatedAtAsc("pending")
                : inquiryRepository.findAllByOrderByCreatedAtDesc();
        return inquiries.stream().map(InquiryAdminResponse::from).collect(Collectors.toList());
    }

    // ── 어드민: 미응답 문의 최대 N건 ────────────────────────────
    @Transactional(readOnly = true)
    public List<InquiryAdminResponse> getPendingInquiries(int limit) {
        return inquiryRepository.findByStatusOrderByCreatedAtAsc("pending")
                .stream().limit(limit).map(InquiryAdminResponse::from).collect(Collectors.toList());
    }

    // ── 어드민: 답변 이메일 발송 ────────────────────────────────
    @Transactional
    public void replyToInquiry(String id, String reply, User admin) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));
        inquiry.setReply(reply);
        inquiry.setStatus("replied");
        inquiry.setRepliedBy(admin);
        inquiry.setRepliedAt(LocalDateTime.now());
        inquiryRepository.save(inquiry);
        if (inquiry.getUser() != null) {
            try {
                notificationService.createInquiryReplyNotification(inquiry.getUser(), inquiry.getTitle());
            } catch (Exception e) {
                log.error("문의 답변 알림 발송 실패: {}", e.getMessage());
            }
        }
        try {
            emailService.sendInquiryReply(inquiry.getEmail(), inquiry.getTitle(), reply);
        } catch (Exception e) {
            log.error("답변 메일 발송 실패 (이메일: {}): {}", inquiry.getEmail(), e.getMessage());
        }
    }

    private void sendEmailSafe(Inquiry inquiry) {
        if (inquiry.getEmail() == null || inquiry.getEmail().isBlank()) return;
        try {
            emailService.sendInquiryConfirmation(inquiry.getEmail(), inquiry.getTitle());
        } catch (Exception e) {
            log.error("문의 확인 메일 발송 실패 (이메일: {}): {}", inquiry.getEmail(), e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || !originalFileName.contains(".")) {
            throw new IllegalArgumentException("올바르지 않은 파일 형식입니다.");
        }

        String extension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1).toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("허용되지 않는 파일 확장자입니다. (JPG, PNG, GIF만 가능)");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 5MB를 초과할 수 없습니다.");
        }
    }

    private String saveFile(MultipartFile file) {
        // Cloudinary로 업로드 (영속성 확보)
        return cloudinaryService.uploadFile(file, "inquiries");
    }
}