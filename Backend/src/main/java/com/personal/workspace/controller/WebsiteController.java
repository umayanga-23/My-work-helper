package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.WebsiteDTO;
import com.personal.workspace.dto.WebsiteRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.WebsiteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/websites")
public class WebsiteController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final WebsiteService websiteService;

    public WebsiteController(WebsiteService websiteService) {
        this.websiteService = websiteService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WebsiteDTO>>> getWebsites(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Boolean isFavorite,
            @RequestParam(required = false) String search) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<WebsiteDTO> websites = websiteService.getWebsites(userId, categoryId, projectId, isFavorite, search);
        return ResponseEntity.ok(ApiResponse.success(websites));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WebsiteDTO>> getWebsiteById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        WebsiteDTO website = websiteService.getWebsiteById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(website));
    }

    @GetMapping("/favicon-preview")
    public ResponseEntity<ApiResponse<String>> getFaviconPreview(@RequestParam String url) {
        String faviconUrl = websiteService.generateFaviconUrl(url);
        return ResponseEntity.ok(ApiResponse.success("Favicon preview URL generated", faviconUrl));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WebsiteDTO>> createWebsite(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody WebsiteRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        WebsiteDTO created = websiteService.createWebsite(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Website added successfully", created), HttpStatus.CREATED);
    }

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<List<WebsiteDTO>>> importBookmarks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody List<WebsiteRequest> requests) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<WebsiteDTO> imported = websiteService.importBookmarks(userId, requests);
        return new ResponseEntity<>(ApiResponse.success("Imported " + imported.size() + " bookmarks successfully", imported), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WebsiteDTO>> updateWebsite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody WebsiteRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        WebsiteDTO updated = websiteService.updateWebsite(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Website updated successfully", updated));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<WebsiteDTO>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        WebsiteDTO updated = websiteService.toggleFavorite(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Website favorite state toggled", updated));
    }

    @PostMapping("/{id}/visit")
    public ResponseEntity<ApiResponse<WebsiteDTO>> recordVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        WebsiteDTO updated = websiteService.recordVisit(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Website visit recorded", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWebsite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        websiteService.deleteWebsite(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Website removed successfully", null));
    }
}
