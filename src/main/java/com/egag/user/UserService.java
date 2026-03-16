package com.egag.user;

import com.egag.common.domain.ArtworkRepository;
import com.egag.common.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ArtworkRepository artworkRepository;
    private final FollowRepository followRepository;

    // TODO: getUser, getUserArtworks, getMe, updateMe, changePassword, deleteMe, toggleFollow
}
