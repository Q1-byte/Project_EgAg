package com.egag.canvas;

import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CanvasService {

    private final ArtworkRepository artworkRepository;
    private final UserRepository userRepository;
    private final StrokeAgent strokeAgent;
    private final ThemeAgent themeAgent;
    private final ColorAgent colorAgent;

    // TODO: startSession, processStroke, suggestTopics, confirmTopic, colorize, save, complete, getSession
}
