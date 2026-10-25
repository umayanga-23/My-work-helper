package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.FolderDTO;
import com.personal.workspace.dto.FolderRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.FolderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FolderDTO>>> getFolders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false, defaultValue = "DOCUMENT") String type,
            @RequestParam(required = false) UUID parentId) {
        List<FolderDTO> folders = folderService.getFolders(principal.getId(), type, parentId);
        return ResponseEntity.ok(ApiResponse.success(folders));
    }

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<FolderDTO>>> getFolderTree(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false, defaultValue = "DOCUMENT") String type) {
        List<FolderDTO> tree = folderService.getFolderTree(principal.getId(), type);
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderDTO>> getFolderById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        FolderDTO folder = folderService.getFolderById(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(folder));
    }

    @GetMapping("/{id}/breadcrumbs")
    public ResponseEntity<ApiResponse<List<FolderDTO>>> getBreadcrumbs(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        List<FolderDTO> breadcrumbs = folderService.getBreadcrumbs(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(breadcrumbs));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FolderDTO>> createFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FolderRequest request) {
        FolderDTO created = folderService.createFolder(principal.getId(), request);
        return new ResponseEntity<>(ApiResponse.success("Folder created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderDTO>> updateFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody FolderRequest request) {
        FolderDTO updated = folderService.updateFolder(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Folder updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        folderService.deleteFolder(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Folder and its contents removed successfully", null));
    }
}
