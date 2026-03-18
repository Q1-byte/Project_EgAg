package com.egag.payment;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentCompleteRequest {
    private String impUid;
    private String merchantUid;
    private String packageId;
}
