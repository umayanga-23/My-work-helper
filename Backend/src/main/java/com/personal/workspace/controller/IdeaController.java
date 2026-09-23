package com.personal.workspace.controller;

import com.personal.workspace.dto.*;
import com.personal.workspace.entity.IdeaStatus;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.IdeaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ideas")
public class IdeaController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final IdeaService ideaService;

    public IdeaController(IdeaService ideaService) {
        this.ideaService = ideaService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<IdeaDTO>>> getIdeas(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) IdeaStatus status,
            @RequestParam(required = false) String search) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<IdeaDTO> ideas = ideaService.getIdeas(userId, status, search);
        return ResponseEntity.ok(ApiResponse.success(ideas));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IdeaDTO>> getIdeaById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        IdeaDTO idea = ideaService.getIdeaById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(idea));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IdeaDTO>> createIdea(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody IdeaRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        IdeaDTO created = ideaService.createIdea(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Idea captured successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IdeaDTO>> updateIdea(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody IdeaRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        IdeaDTO updated = ideaService.updateIdea(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Idea updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<IdeaDTO>> updateIdeaStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam IdeaStatus status) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        IdeaDTO updated = ideaService.updateIdeaStatus(userId, id, status);
        return ResponseEntity.ok(ApiResponse.success("Idea status updated", updated));
    }

    @PostMapping("/{id}/convert-to-project")
    public ResponseEntity<ApiResponse<ProjectDTO>> convertToProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectDTO createdProject = ideaService.convertIdeaToProject(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Idea successfully converted to Active Project!", createdProject));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIdea(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ideaService.deleteIdea(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Idea removed successfully", null));
    }
}
