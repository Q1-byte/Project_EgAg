package com.egag.search;

import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ArtworkRepository artworkRepository;
    private final UserRepository userRepository;

    // TODO: search
}
