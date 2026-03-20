package com.egag.search.dto;

import com.egag.artwork.dto.ArtworkResponse;
import com.egag.user.dto.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponse {
    private List<ArtworkResponse> artworks;
    private List<UserResponse> users;
}
