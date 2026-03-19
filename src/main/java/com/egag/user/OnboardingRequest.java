package com.egag.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OnboardingRequest {
    private String name;
    private String phone;
    private String email; // 카카오 이메일 미제공 시 직접 입력
}
