package com.egag.user;

import com.egag.common.domain.ArtworkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final ArtworkRepository artworkRepository;

    /** 공개된 모든 작품 목록 (갤러리 페이지용) */
    @Transactional(readOnly = true)
    public List<ArtworkSummary> getPublicArtworks() {
        return artworkRepository.findAllByIsPublicTrue().stream()
                .map(ArtworkSummary::new)
                .collect(Collectors.toList());
    }
}
