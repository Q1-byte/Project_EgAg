package com.egag.payment;

import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TokenLogRepository tokenLogRepository;
    private final UserRepository userRepository;

    // TODO: prepare, complete, webhook, getPayments
}
