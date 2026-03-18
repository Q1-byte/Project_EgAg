package com.egag.payment;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PackageDto {
    private String id;
    private String displayName;
    private int tokenAmount;
    private int price;
    private boolean popular;
    private boolean bestValue;
}
