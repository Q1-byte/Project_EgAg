package com.egag.user;

import com.egag.common.domain.ArtworkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final ArtworkRepository artworkRepository;

    // TODO: getMyGallery
}
