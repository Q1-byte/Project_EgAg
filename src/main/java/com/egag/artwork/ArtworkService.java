package com.egag.artwork;

import com.egag.common.domain.ArtworkRepository;
import com.egag.admin.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ArtworkService {

    private final ArtworkRepository artworkRepository;
    private final LikeRepository likeRepository;
    private final ReportRepository reportRepository;

    // TODO: getArtwork, explore, toggleVisibility, delete, toggleLike, report
}
