package com.egag.payment;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentResponse {
    private boolean success;
    private String message;
    private Integer newTokenBalance;
    private String merchantUid;
    private String bankName;
    private String bankAccount;
    private String accountHolder;
}
