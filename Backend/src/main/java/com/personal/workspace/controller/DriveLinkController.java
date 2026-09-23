package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.DriveLinkDTO;
import com.personal.workspace.dto.DriveLinkRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.DriveLinkService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/drive-links")
public class DriveLinkController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final DriveLinkService driveLinkService;

    public DriveLinkController(DriveLinkService driveLinkService) {
        this.driveLinkService = driveLinkService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DriveLinkDTO>>> getDriveLinks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Boolean isFavorite,
            @RequestParam(required = false) String search) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<DriveLinkDTO> links = driveLinkService.getDriveLinks(userId, categoryId, projectId, isFavorite, search);
        return ResponseEntity.ok(ApiResponse.success(links));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DriveLinkDTO>> getDriveLinkById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DriveLinkDTO link = driveLinkService.getDriveLinkById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(link));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DriveLinkDTO>> createDriveLink(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DriveLinkRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DriveLinkDTO created = driveLinkService.createDriveLink(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Google Drive link added", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DriveLinkDTO>> updateDriveLink(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody DriveLinkRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DriveLinkDTO updated = driveLinkService.updateDriveLink(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Google Drive link updated", updated));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<DriveLinkDTO>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DriveLinkDTO updated = driveLinkService.toggleFavorite(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Google Drive favorite state toggled", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDriveLink(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        driveLinkService.deleteDriveLink(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Google Drive link deleted", null));
    }
}
