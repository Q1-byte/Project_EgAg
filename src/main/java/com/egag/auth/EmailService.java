package com.egag.auth;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service("authEmailService")
public class EmailService {

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from}")
    private String fromAddress;

    @Value("${app.base-url}")
    private String baseUrl;

    public void sendPasswordResetEmail(String toEmail, String nickname, String resetToken) {
        String resetLink = baseUrl + "/password-reset/confirm?token=" + resetToken;

        String html = """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1D4ED8;">🪞 Decalco 비밀번호 재설정</h2>
                  <p><strong>%s</strong>님, 안녕하세요.</p>
                  <p>비밀번호 재설정 요청이 접수되었습니다.<br>
                  아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
                  <a href="%s"
                     style="display: inline-block; margin: 24px 0; padding: 14px 32px;
                            background: linear-gradient(135deg, #3B82F6, #6366F1);
                            color: #fff; border-radius: 10px; text-decoration: none;
                            font-weight: 700; font-size: 15px;">
                    비밀번호 재설정하기
                  </a>
                  <p style="color: #94A3B8; font-size: 13px;">
                    이 링크는 <strong>30분</strong> 후 만료됩니다.<br>
                    본인이 요청하지 않은 경우 이 메일을 무시해주세요.
                  </p>
                </div>
                """.formatted(nickname, resetLink);

        try {
            Resend resend = new Resend(apiKey);
            CreateEmailOptions options = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(toEmail)
                    .subject("[Decalco] 비밀번호 재설정 안내")
                    .html(html)
                    .build();

            resend.emails().send(options);
            log.info("비밀번호 재설정 메일 발송 완료: {}", toEmail);
        } catch (ResendException e) {
            log.error("메일 발송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }
}
