package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.DocumentDTO;
import com.personal.workspace.dto.DocumentRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentDTO>>> getDocuments(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String search) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<DocumentDTO> documents = documentService.getDocuments(userId, categoryId, projectId, search);
        return ResponseEntity.ok(ApiResponse.success(documents));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentDTO>> getDocumentById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DocumentDTO document = documentService.getDocumentById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(document));
    }

    @GetMapping("/{id}/download-url")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        String downloadUrl = documentService.generateDownloadUrl(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Pre-signed download URL generated", downloadUrl));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentDTO>> uploadDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "categoryId", required = false) UUID categoryId,
            @RequestParam(value = "projectId", required = false) UUID projectId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "tags", required = false) String tags) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DocumentDTO created = documentService.uploadDocumentFile(userId, file, name, categoryId, projectId, description, tags);
        return new ResponseEntity<>(ApiResponse.success("Document uploaded to Supabase successfully", created), HttpStatus.CREATED);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DocumentDTO>> createDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DocumentRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DocumentDTO created = documentService.createDocument(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Document metadata registered successfully", created), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<DocumentDTO>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DocumentDTO updated = documentService.toggleFavorite(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Favorite updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        documentService.deleteDocument(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Document removed successfully", null));
    }
}
