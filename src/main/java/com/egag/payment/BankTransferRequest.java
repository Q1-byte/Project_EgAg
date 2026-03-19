package com.egag.payment;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BankTransferRequest {
    private String packageId;
    private String depositorName;
    private String bankType; // kakao, toss, kb, shinhan
}
