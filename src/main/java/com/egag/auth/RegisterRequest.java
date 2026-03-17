package com.egag.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RegisterRequest {

    @NotBlank(message = "이름을 입력해주세요.")
    @Size(min = 2, max = 50, message = "이름은 2~50자 사이여야 합니다.")
    private String name;

    @NotBlank(message = "별명을 입력해주세요.")
    @Size(min = 2, max = 12, message = "별명은 2~12자 사이여야 합니다.")
    private String nickname;

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일을 입력해주세요.")
    private String email;

    @NotBlank(message = "전화번호를 입력해주세요.")
    private String phone;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    private String password;
}