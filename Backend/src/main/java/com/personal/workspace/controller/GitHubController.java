package com.personal.workspace.controller;

import com.personal.workspace.dto.TaskGitCommitDTO;
import com.personal.workspace.entity.TaskGitCommitEntity;
import com.personal.workspace.repository.TaskGitCommitRepository;
import com.personal.workspace.service.GitHubSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GitHubController {

    private final GitHubSyncService gitHubSyncService;
    private final TaskGitCommitRepository taskGitCommitRepository;

    public GitHubController(GitHubSyncService gitHubSyncService,
                            TaskGitCommitRepository taskGitCommitRepository) {
        this.gitHubSyncService = gitHubSyncService;
        this.taskGitCommitRepository = taskGitCommitRepository;
    }

    /**
     * GitHub Webhook Receiver
     */
    @PostMapping("/webhooks/github")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "push") String eventType) {
        Map<String, Object> response = gitHubSyncService.processWebhook(payload, eventType);
        return ResponseEntity.ok(response);
    }

    /**
     * On-Demand GitHub Repository Commits Sync
     */
    @PostMapping("/projects/{projectId}/github/sync")
    public ResponseEntity<Map<String, Object>> syncProjectCommits(@PathVariable UUID projectId) {
        Map<String, Object> response = gitHubSyncService.syncProjectCommitsFromGitHub(projectId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get Git Activity Timeline for a Project
     */
    @GetMapping("/projects/{projectId}/github/activity")
    public ResponseEntity<List<TaskGitCommitDTO>> getProjectGitActivity(@PathVariable UUID projectId) {
        List<TaskGitCommitEntity> commits = taskGitCommitRepository.findByProjectIdOrderByTimestampDesc(projectId);
        List<TaskGitCommitDTO> dtoList = commits.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    /**
     * Get Git Activity Timeline for a specific Task
     */
    @GetMapping("/tasks/{taskId}/github/activity")
    public ResponseEntity<List<TaskGitCommitDTO>> getTaskGitActivity(@PathVariable UUID taskId) {
        List<TaskGitCommitEntity> commits = taskGitCommitRepository.findByTaskIdOrderByTimestampDesc(taskId);
        List<TaskGitCommitDTO> dtoList = commits.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    private TaskGitCommitDTO mapToDTO(TaskGitCommitEntity c) {
        TaskGitCommitDTO dto = new TaskGitCommitDTO();
        dto.setId(c.getId());
        dto.setTaskId(c.getTaskId());
        dto.setProjectId(c.getProjectId());
        dto.setTaskKey(c.getTaskKey());
        dto.setCommitHash(c.getCommitHash());
        dto.setMessage(c.getMessage());
        dto.setAuthorName(c.getAuthorName());
        dto.setCommitUrl(c.getCommitUrl());
        dto.setTimestamp(c.getTimestamp());
        dto.setEventType(c.getEventType());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
