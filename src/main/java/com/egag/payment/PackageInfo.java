package com.egag.payment;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PackageInfo {

    BASIC("BASIC", "Basic", 10, 2900),
    STANDARD("STANDARD", "Standard", 30, 7900),
    PREMIUM("PREMIUM", "Premium", 100, 19900);

    private final String id;
    private final String displayName;
    private final int tokenAmount;
    private final int price;

    public static PackageInfo fromId(String id) {
        for (PackageInfo pkg : values()) {
            if (pkg.id.equalsIgnoreCase(id)) return pkg;
        }
        throw new IllegalArgumentException("알 수 없는 패키지: " + id);
    }
}
