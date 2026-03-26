package com.egag.inquiry.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class InquiryRequest {
    private String category; // 결제 문제, 버그 신고 등
    private String title;
    private String content;
    private String email;
    // 파일은 MultipartFile로 별도 처리하거나 URL로 받을 경우 사용
    private String attachmentUrl;
}