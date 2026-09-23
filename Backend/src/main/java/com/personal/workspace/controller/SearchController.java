package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.SearchResultDTO;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SearchResultDTO>>> globalSearch(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("q") String query) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<SearchResultDTO> results = searchService.searchAll(userId, query);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
