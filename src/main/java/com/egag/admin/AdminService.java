package com.egag.admin;

import com.egag.common.domain.UserRepository;
import com.egag.payment.TokenLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final TokenLogRepository tokenLogRepository;

    // TODO: getReports, resolveReport, getUsers, suspendUser, grantTokens
}
