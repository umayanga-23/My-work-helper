package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.ProjectDTO;
import com.personal.workspace.dto.ProjectRequest;
import com.personal.workspace.dto.ProjectWorkspaceDTO;
import com.personal.workspace.entity.ProjectStatus;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final ProjectService projectService;
    private final com.personal.workspace.service.ActivityLogService activityLogService;

    public ProjectController(ProjectService projectService, com.personal.workspace.service.ActivityLogService activityLogService) {
        this.projectService = projectService;
        this.activityLogService = activityLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectDTO>>> getProjects(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String search) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<ProjectDTO> projects = projectService.getProjects(userId, status, search);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDTO>> getProjectById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectDTO project = projectService.getProjectById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @GetMapping("/{id}/workspace")
    public ResponseEntity<ApiResponse<ProjectWorkspaceDTO>> getProjectWorkspace(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectWorkspaceDTO workspace = projectService.getProjectWorkspace(userId, id);
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDTO>> createProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProjectRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectDTO created = projectService.createProject(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Project created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDTO>> updateProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ProjectRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectDTO updated = projectService.updateProject(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ProjectDTO>> updateProjectStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam ProjectStatus status) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectDTO updated = projectService.updateProjectStatus(userId, id, status);
        return ResponseEntity.ok(ApiResponse.success("Project status updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        projectService.deleteProject(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }

    // --- Milestones Endpoints ---
    @GetMapping("/{id}/milestones")
    public ResponseEntity<ApiResponse<List<com.personal.workspace.dto.ProjectMilestoneDTO>>> getProjectMilestones(
            @PathVariable UUID id) {
        List<com.personal.workspace.dto.ProjectMilestoneDTO> milestones = projectService.getProjectMilestones(id);
        return ResponseEntity.ok(ApiResponse.success(milestones));
    }

    @PostMapping("/{id}/milestones")
    public ResponseEntity<ApiResponse<com.personal.workspace.dto.ProjectMilestoneDTO>> createProjectMilestone(
            @PathVariable UUID id,
            @Valid @RequestBody com.personal.workspace.dto.ProjectMilestoneRequest request) {
        com.personal.workspace.dto.ProjectMilestoneDTO created = projectService.createProjectMilestone(id, request);
        return new ResponseEntity<>(ApiResponse.success("Milestone created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/milestones/{milestoneId}")
    public ResponseEntity<ApiResponse<com.personal.workspace.dto.ProjectMilestoneDTO>> updateProjectMilestone(
            @PathVariable UUID id,
            @PathVariable UUID milestoneId,
            @Valid @RequestBody com.personal.workspace.dto.ProjectMilestoneRequest request) {
        com.personal.workspace.dto.ProjectMilestoneDTO updated = projectService.updateProjectMilestone(id, milestoneId, request);
        return ResponseEntity.ok(ApiResponse.success("Milestone updated successfully", updated));
    }

    @DeleteMapping("/{id}/milestones/{milestoneId}")
    public ResponseEntity<ApiResponse<Void>> deleteProjectMilestone(
            @PathVariable UUID id,
            @PathVariable UUID milestoneId) {
        projectService.deleteProjectMilestone(id, milestoneId);
        return ResponseEntity.ok(ApiResponse.success("Milestone deleted successfully", null));
    }

    // --- Issues Endpoints ---
    @GetMapping("/{id}/issues")
    public ResponseEntity<ApiResponse<List<com.personal.workspace.dto.ProjectIssueDTO>>> getProjectIssues(
            @PathVariable UUID id) {
        List<com.personal.workspace.dto.ProjectIssueDTO> issues = projectService.getProjectIssues(id);
        return ResponseEntity.ok(ApiResponse.success(issues));
    }

    @PostMapping("/{id}/issues")
    public ResponseEntity<ApiResponse<com.personal.workspace.dto.ProjectIssueDTO>> createProjectIssue(
            @PathVariable UUID id,
            @Valid @RequestBody com.personal.workspace.dto.ProjectIssueRequest request) {
        com.personal.workspace.dto.ProjectIssueDTO created = projectService.createProjectIssue(id, request);
        return new ResponseEntity<>(ApiResponse.success("Issue created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/issues/{issueId}")
    public ResponseEntity<ApiResponse<com.personal.workspace.dto.ProjectIssueDTO>> updateProjectIssue(
            @PathVariable UUID id,
            @PathVariable UUID issueId,
            @Valid @RequestBody com.personal.workspace.dto.ProjectIssueRequest request) {
        com.personal.workspace.dto.ProjectIssueDTO updated = projectService.updateProjectIssue(id, issueId, request);
        return ResponseEntity.ok(ApiResponse.success("Issue updated successfully", updated));
    }

    @DeleteMapping("/{id}/issues/{issueId}")
    public ResponseEntity<ApiResponse<Void>> deleteProjectIssue(
            @PathVariable UUID id,
            @PathVariable UUID issueId) {
        projectService.deleteProjectIssue(id, issueId);
        return ResponseEntity.ok(ApiResponse.success("Issue deleted successfully", null));
    }

    // --- Unified Project Resource Linking ---
    @PostMapping("/{id}/link-resource")
    public ResponseEntity<ApiResponse<Void>> linkResource(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) com.personal.workspace.entity.ResourceType resourceType,
            @RequestParam(required = false) UUID resourceId,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;

        com.personal.workspace.entity.ResourceType finalType = resourceType;
        UUID finalId = resourceId;

        if (body != null) {
            if (finalType == null && body.get("resourceType") != null) {
                finalType = com.personal.workspace.entity.ResourceType.valueOf(body.get("resourceType").toString().toUpperCase());
            }
            if (finalId == null && body.get("resourceId") != null) {
                finalId = UUID.fromString(body.get("resourceId").toString());
            }
        }

        if (finalType == null || finalId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Both resourceType and resourceId are required"));
        }

        projectService.linkResourceToProject(userId, id, finalType, finalId);
        return ResponseEntity.ok(ApiResponse.success("Resource linked to project", null));
    }

    @PostMapping("/{id}/unlink-resource")
    public ResponseEntity<ApiResponse<Void>> unlinkResource(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) com.personal.workspace.entity.ResourceType resourceType,
            @RequestParam(required = false) UUID resourceId,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;

        com.personal.workspace.entity.ResourceType finalType = resourceType;
        UUID finalId = resourceId;

        if (body != null) {
            if (finalType == null && body.get("resourceType") != null) {
                finalType = com.personal.workspace.entity.ResourceType.valueOf(body.get("resourceType").toString().toUpperCase());
            }
            if (finalId == null && body.get("resourceId") != null) {
                finalId = UUID.fromString(body.get("resourceId").toString());
            }
        }

        if (finalType == null || finalId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Both resourceType and resourceId are required"));
        }

        projectService.unlinkResourceFromProject(userId, id, finalType, finalId);
        return ResponseEntity.ok(ApiResponse.success("Resource unlinked from project", null));
    }

    // --- Project Activity Timeline ---
    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<List<com.personal.workspace.dto.ActivityLogDTO>>> getProjectActivity(
            @PathVariable UUID id) {
        List<com.personal.workspace.dto.ActivityLogDTO> activities = activityLogService.getProjectActivities(id);
        return ResponseEntity.ok(ApiResponse.success("Project activity retrieved successfully", activities));
    }

    // --- Project AI Assistant ---
    @PostMapping("/{id}/ai/chat")
    public ResponseEntity<ApiResponse<String>> projectAiChat(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, Object> body) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        String message = body.containsKey("message") ? body.get("message").toString() : "";
        @SuppressWarnings("unchecked")
        List<java.util.Map<String, String>> history = body.containsKey("conversationHistory")
                ? (List<java.util.Map<String, String>>) body.get("conversationHistory")
                : java.util.Collections.emptyList();
        String reply = projectService.chatWithProjectContext(userId, id, message, history);
        return ResponseEntity.ok(ApiResponse.success("OK", reply));
    }
}
