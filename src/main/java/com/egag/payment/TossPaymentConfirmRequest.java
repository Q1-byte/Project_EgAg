package com.egag.payment;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TossPaymentConfirmRequest {
    private String paymentKey;
    private String orderId;
    private int amount;
    private String packageId;
}
