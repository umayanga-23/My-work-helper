package com.personal.workspace.service;

import com.personal.workspace.entity.ProjectEntity;
import com.personal.workspace.entity.TaskEntity;
import com.personal.workspace.entity.TaskGitCommitEntity;
import com.personal.workspace.entity.TaskStatus;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.ProjectRepository;
import com.personal.workspace.repository.TaskGitCommitRepository;
import com.personal.workspace.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.ZonedDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GitHubSyncService {

    private static final Logger log = LoggerFactory.getLogger(GitHubSyncService.class);
    private static final Pattern TASK_KEY_PATTERN = Pattern.compile("(?i)\\b([A-Z0-9]{2,10}-\\d+)\\b");
    private static final Pattern AUTO_CLOSE_PATTERN = Pattern.compile("(?i)\\b(fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\\b");

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskGitCommitRepository taskGitCommitRepository;
    private final RestTemplate restTemplate;
    private final ActivityLogService activityLogService;

    public GitHubSyncService(ProjectRepository projectRepository,
                             TaskRepository taskRepository,
                             TaskGitCommitRepository taskGitCommitRepository,
                             RestTemplateBuilder restTemplateBuilder,
                             ActivityLogService activityLogService) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.taskGitCommitRepository = taskGitCommitRepository;
        this.restTemplate = restTemplateBuilder.build();
        this.activityLogService = activityLogService;
    }

    /**
     * Handles incoming GitHub Webhooks (Push and Pull Request events)
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> processWebhook(Map<String, Object> payload, String eventType) {
        Map<String, Object> result = new HashMap<>();
        int commitsProcessed = 0;
        int tasksCompleted = 0;

        if ("push".equalsIgnoreCase(eventType) && payload.containsKey("commits")) {
            List<Map<String, Object>> commits = (List<Map<String, Object>>) payload.get("commits");
            for (Map<String, Object> commit : commits) {
                String sha = (String) commit.get("id");
                String message = (String) commit.get("message");
                String url = (String) commit.get("url");
                Map<String, Object> author = (Map<String, Object>) commit.get("author");
                String authorName = author != null ? (String) author.get("name") : "GitHub User";

                boolean completed = linkCommitAndCheckAutomation(sha, message, url, authorName, "PUSH", null);
                commitsProcessed++;
                if (completed) tasksCompleted++;
            }
        } else if ("pull_request".equalsIgnoreCase(eventType)) {
            Map<String, Object> pr = (Map<String, Object>) payload.get("pull_request");
            String action = (String) payload.get("action");
            boolean isMerged = Boolean.TRUE.equals(pr.get("merged"));
            String title = (String) pr.get("title");
            String htmlUrl = (String) pr.get("html_url");
            Map<String, Object> user = (Map<String, Object>) pr.get("user");
            String authorName = user != null ? (String) user.get("login") : "GitHub User";
            String sha = (String) pr.get("node_id");

            if ("closed".equalsIgnoreCase(action) && isMerged) {
                boolean completed = linkCommitAndCheckAutomation(
                        sha != null ? sha : UUID.randomUUID().toString().substring(0, 8),
                        "Merged PR: " + title,
                        htmlUrl,
                        authorName,
                        "PULL_REQUEST_MERGED",
                        null
                );
                commitsProcessed++;
                if (completed) tasksCompleted++;
            }
        }

        result.put("commitsProcessed", commitsProcessed);
        result.put("tasksCompleted", tasksCompleted);
        result.put("status", "SUCCESS");
        return result;
    }

    /**
     * Direct On-Demand Sync: Fetches recent commits from GitHub REST API
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> syncProjectCommitsFromGitHub(UUID projectId) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        String rawRepo = project.getGithubRepo();
        if (rawRepo == null || rawRepo.trim().isEmpty()) {
            throw new IllegalArgumentException("No GitHub repository linked to this project. Please set repository name in Project settings.");
        }

        String repoPath = extractRepoOwnerAndName(rawRepo);
        String apiUrl = "https://api.github.com/repos/" + repoPath + "/commits?per_page=30";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("User-Agent", "AIU-Workspace");
        if (project.getGithubToken() != null && !project.getGithubToken().trim().isEmpty()) {
            headers.set("Authorization", "Bearer " + project.getGithubToken().trim());
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);
        int syncedCount = 0;
        int tasksUpdated = 0;

        try {
            ParameterizedTypeReference<List<Map<String, Object>>> responseType =
                    new ParameterizedTypeReference<>() {};
            ResponseEntity<List<Map<String, Object>>> response =
                    restTemplate.exchange(apiUrl, HttpMethod.GET, entity, responseType);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> commits = response.getBody();
                for (Map<String, Object> commitObj : commits) {
                    String sha = (String) commitObj.get("sha");
                    String htmlUrl = (String) commitObj.get("html_url");
                    Map<String, Object> commitData = (Map<String, Object>) commitObj.get("commit");
                    String message = commitData != null ? (String) commitData.get("message") : "";
                    Map<String, Object> authorObj = commitData != null ? (Map<String, Object>) commitData.get("author") : null;
                    String authorName = authorObj != null ? (String) authorObj.get("name") : "Developer";
                    String commitDateStr = authorObj != null ? (String) authorObj.get("date") : null;
                    ZonedDateTime commitTime = ZonedDateTime.now();
                    if (commitDateStr != null) {
                        try {
                            commitTime = ZonedDateTime.parse(commitDateStr);
                        } catch (Exception ignored) {}
                    }

                    boolean autoCompleted = linkCommitAndCheckAutomation(sha, message, htmlUrl, authorName, "SYNC", project.getId(), commitTime);
                    syncedCount++;
                    if (autoCompleted) tasksUpdated++;
                }
            }
        } catch (Exception e) {
            log.error("Failed to sync GitHub commits for project {}: {}", projectId, e.getMessage());
            throw new RuntimeException("GitHub Sync Failed: " + e.getMessage());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("syncedCommits", syncedCount);
        res.put("tasksUpdated", tasksUpdated);
        res.put("repo", repoPath);
        return res;
    }

    /**
     * Extracts task key from text, records commit, and triggers smart automation if fix keyword is present.
     */
    private boolean linkCommitAndCheckAutomation(String sha, String message, String url, String author, String eventType, UUID explicitProjectId) {
        return linkCommitAndCheckAutomation(sha, message, url, author, eventType, explicitProjectId, ZonedDateTime.now());
    }

    private boolean linkCommitAndCheckAutomation(String sha, String message, String url, String author, String eventType, UUID explicitProjectId, ZonedDateTime timestamp) {
        if (message == null || sha == null) return false;

        String shortHash = sha.length() > 7 ? sha.substring(0, 7) : sha;
        Matcher matcher = TASK_KEY_PATTERN.matcher(message);
        boolean taskAutoCompleted = false;
        boolean matchedAnyTask = false;

        while (matcher.find()) {
            matchedAnyTask = true;
            String taskKey = matcher.group(1).toUpperCase();
            Optional<TaskEntity> taskOpt = taskRepository.findByTaskKey(taskKey);

            UUID taskId = null;
            UUID projectId = explicitProjectId;

            if (taskOpt.isPresent()) {
                TaskEntity task = taskOpt.get();
                taskId = task.getId();
                if (projectId == null) {
                    projectId = task.getProjectId();
                }

                // Smart Automation Check:
                // If commit message contains Fix / Close / Resolve or is PR Merged, auto-complete task!
                if ("PULL_REQUEST_MERGED".equals(eventType) || AUTO_CLOSE_PATTERN.matcher(message).find()) {
                    if (task.getStatus() != TaskStatus.COMPLETED) {
                        task.setStatus(TaskStatus.COMPLETED);
                        task.setCompletedAt(ZonedDateTime.now());
                        taskRepository.save(task);
                        taskAutoCompleted = true;
                        log.info("🎯 Smart Automation: Task {} marked as COMPLETED by commit/PR: {}", taskKey, sha);
                    }
                }
            }

            // Save commit entity if not exists for this commit
            if (!taskGitCommitRepository.existsByCommitHash(shortHash)) {
                TaskGitCommitEntity commitEntity = new TaskGitCommitEntity();
                commitEntity.setCommitHash(shortHash);
                commitEntity.setMessage(message);
                commitEntity.setCommitUrl(url);
                commitEntity.setAuthorName(author);
                commitEntity.setTaskKey(taskKey);
                commitEntity.setTaskId(taskId);
                commitEntity.setProjectId(projectId);
                commitEntity.setEventType(eventType);
                commitEntity.setTimestamp(timestamp != null ? timestamp : ZonedDateTime.now());
                taskGitCommitRepository.save(commitEntity);

                UUID targetProjId = explicitProjectId != null ? explicitProjectId : projectId;
                if (targetProjId != null) {
                    projectRepository.findById(targetProjId).ifPresent(p -> {
                        activityLogService.logSafe(p.getUserId(), targetProjId, "GitHub commit detected", "GITHUB", null, shortHash + ": " + message);
                    });
                }
            }
        }

        // If commit didn't match a specific task key, but belongs to an explicit project sync,
        // record it so Git activity appears in the Project Workspace Git Timeline.
        if (!matchedAnyTask && explicitProjectId != null) {
            if (!taskGitCommitRepository.existsByCommitHash(shortHash)) {
                TaskGitCommitEntity commitEntity = new TaskGitCommitEntity();
                commitEntity.setCommitHash(shortHash);
                commitEntity.setMessage(message);
                commitEntity.setCommitUrl(url);
                commitEntity.setAuthorName(author);
                commitEntity.setTaskKey(null);
                commitEntity.setTaskId(null);
                commitEntity.setProjectId(explicitProjectId);
                commitEntity.setEventType(eventType);
                commitEntity.setTimestamp(timestamp != null ? timestamp : ZonedDateTime.now());
                taskGitCommitRepository.save(commitEntity);

                projectRepository.findById(explicitProjectId).ifPresent(p -> {
                    activityLogService.logSafe(p.getUserId(), explicitProjectId, "GitHub commit detected", "GITHUB", null, shortHash + ": " + message);
                });
            }
        }

        return taskAutoCompleted;
    }

    private String extractRepoOwnerAndName(String raw) {
        String clean = raw.trim()
                .replace("https://github.com/", "")
                .replace("http://github.com/", "")
                .replace("git@github.com:", "")
                .replace(".git", "");
        if (clean.endsWith("/")) {
            clean = clean.substring(0, clean.length() - 1);
        }
        return clean;
    }
}
