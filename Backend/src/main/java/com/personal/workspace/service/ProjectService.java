package com.personal.workspace.service;

import com.personal.workspace.dto.*;
import com.personal.workspace.entity.*;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskGitCommitRepository taskGitCommitRepository;
    private final ProjectMilestoneRepository projectMilestoneRepository;
    private final ProjectIssueRepository projectIssueRepository;
    private final ActivityLogRepository activityLogRepository;
    private final TaskService taskService;
    private final NoteService noteService;
    private final DocumentService documentService;
    private final WebsiteService websiteService;
    private final DriveLinkService driveLinkService;
    private final NoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final WebsiteRepository websiteRepository;
    private final DriveLinkRepository driveLinkRepository;
    private final ActivityLogService activityLogService;
    private final AiService aiService;

    public ProjectService(ProjectRepository projectRepository,
                          TaskRepository taskRepository,
                          TaskGitCommitRepository taskGitCommitRepository,
                          ProjectMilestoneRepository projectMilestoneRepository,
                          ProjectIssueRepository projectIssueRepository,
                          ActivityLogRepository activityLogRepository,
                          TaskService taskService,
                          NoteService noteService,
                          DocumentService documentService,
                          WebsiteService websiteService,
                          DriveLinkService driveLinkService,
                          NoteRepository noteRepository,
                          DocumentRepository documentRepository,
                          WebsiteRepository websiteRepository,
                          DriveLinkRepository driveLinkRepository,
                          ActivityLogService activityLogService,
                          AiService aiService) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.taskGitCommitRepository = taskGitCommitRepository;
        this.projectMilestoneRepository = projectMilestoneRepository;
        this.projectIssueRepository = projectIssueRepository;
        this.activityLogRepository = activityLogRepository;
        this.taskService = taskService;
        this.noteService = noteService;
        this.documentService = documentService;
        this.websiteService = websiteService;
        this.driveLinkService = driveLinkService;
        this.noteRepository = noteRepository;
        this.documentRepository = documentRepository;
        this.websiteRepository = websiteRepository;
        this.driveLinkRepository = driveLinkRepository;
        this.activityLogService = activityLogService;
        this.aiService = aiService;
    }

    public List<ProjectDTO> getProjects(UUID userId, ProjectStatus status, String search) {
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        List<ProjectEntity> entities = projectRepository.filterProjects(userId, status, searchPattern);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public ProjectDTO getProjectById(UUID userId, UUID id) {
        ProjectEntity entity = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToDTO(entity);
    }

    public ProjectWorkspaceDTO getProjectWorkspace(UUID userId, UUID projectId) {
        ProjectDTO project = getProjectById(userId, projectId);
        List<TaskDTO> tasks = taskService.getTasks(userId, null, null, projectId, null);
        List<NoteDTO> notes = noteService.getNotes(userId, null, projectId, null, null, null);
        List<DocumentDTO> documents = documentService.getDocuments(userId, null, projectId, null);
        List<WebsiteDTO> websites = websiteService.getWebsites(userId, null, projectId, null, null);
        List<DriveLinkDTO> driveLinks = driveLinkService.getDriveLinks(userId, null, projectId, null, null);

        // Recalculate live progress percentage based on task completion
        if (!tasks.isEmpty()) {
            long completed = tasks.stream().filter(t -> t.getStatus() == com.personal.workspace.entity.TaskStatus.COMPLETED).count();
            int calcProgress = (int) Math.round(((double) completed / tasks.size()) * 100);
            project.setProgress(calcProgress);
            project.setTaskCount(tasks.size());
            project.setCompletedTaskCount(completed);
        } else {
            project.setTaskCount(0);
            project.setCompletedTaskCount(0L);
        }

        // Project Git Activity / Commits
        List<TaskGitCommitDTO> gitCommits = taskGitCommitRepository.findByProjectIdOrderByTimestampDesc(projectId)
                .stream().map(c -> {
                    TaskGitCommitDTO cDto = new TaskGitCommitDTO();
                    cDto.setId(c.getId());
                    cDto.setTaskId(c.getTaskId());
                    cDto.setProjectId(c.getProjectId());
                    cDto.setTaskKey(c.getTaskKey());
                    cDto.setCommitHash(c.getCommitHash());
                    cDto.setMessage(c.getMessage());
                    cDto.setAuthorName(c.getAuthorName());
                    cDto.setCommitUrl(c.getCommitUrl());
                    cDto.setTimestamp(c.getTimestamp());
                    cDto.setEventType(c.getEventType());
                    cDto.setCreatedAt(c.getCreatedAt());
                    return cDto;
                }).collect(Collectors.toList());

        // Milestones
        List<ProjectMilestoneDTO> milestones = projectMilestoneRepository.findByProjectIdOrderByCreatedAtAsc(projectId)
                .stream().map(this::mapMilestoneToDTO).collect(Collectors.toList());

        // Issues
        List<ProjectIssueDTO> issues = projectIssueRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::mapIssueToDTO).collect(Collectors.toList());

        // Contextual Activity Stream for this project
        List<ActivityLogDTO> activity = activityLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(a -> new ActivityLogDTO(a.getId(), a.getUserId(), a.getProjectId(), a.getAction(), a.getEntityType(), a.getEntityId(), a.getMetadata(), a.getCreatedAt()))
                .collect(Collectors.toList());

        return new ProjectWorkspaceDTO(project, tasks, notes, documents, websites, driveLinks, gitCommits, milestones, issues, activity);
    }

    @Transactional
    public ProjectDTO createProject(UUID userId, ProjectRequest request) {
        ProjectEntity project = new ProjectEntity();
        project.setUserId(userId);
        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project.setStatus(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNING);
        project.setStartDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now());
        project.setEndDate(request.getEndDate());
        project.setProgress(request.getProgress() != null ? request.getProgress() : 0);

        // Auto-generate project key if not explicitly given
        String key = request.getProjectKey();
        if (key == null || key.trim().isEmpty()) {
            key = generateProjectKey(request.getName());
        }
        project.setProjectKey(key.toUpperCase().trim());
        project.setGithubRepo(request.getGithubRepo());
        project.setGithubToken(request.getGithubToken());

        ProjectEntity saved = projectRepository.save(project);

        // Log activity
        activityLogService.logSafe(userId, saved.getId(), "Project created", "PROJECT", saved.getId(), saved.getName());
        if (saved.getGithubRepo() != null && !saved.getGithubRepo().isBlank()) {
            activityLogService.logSafe(userId, saved.getId(), "GitHub repository connected", "GITHUB", saved.getId(), saved.getGithubRepo());
        }

        return mapToDTO(saved);
    }

    @Transactional
    public ProjectDTO updateProject(UUID userId, UUID id, ProjectRequest request) {
        ProjectEntity project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        String oldRepo = project.getGithubRepo();
        String newRepo = request.getGithubRepo() != null ? request.getGithubRepo().trim() : null;
        boolean repoConnected = newRepo != null && !newRepo.isBlank() && !newRepo.equalsIgnoreCase(oldRepo != null ? oldRepo.trim() : "");

        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        if (request.getProgress() != null) project.setProgress(request.getProgress());

        if (request.getProjectKey() != null && !request.getProjectKey().trim().isEmpty()) {
            project.setProjectKey(request.getProjectKey().toUpperCase().trim());
        }
        if (request.getGithubRepo() != null) project.setGithubRepo(request.getGithubRepo().trim());
        if (request.getGithubToken() != null) project.setGithubToken(request.getGithubToken().trim());

        ProjectEntity updated = projectRepository.save(project);

        activityLogService.logSafe(userId, updated.getId(), "Project updated", "PROJECT", updated.getId(), updated.getName());
        if (repoConnected) {
            activityLogService.logSafe(userId, updated.getId(), "GitHub repository connected", "GITHUB", updated.getId(), newRepo);
        }

        return mapToDTO(updated);
    }

    @Transactional
    public ProjectDTO updateProjectStatus(UUID userId, UUID id, ProjectStatus status) {
        ProjectEntity project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        project.setStatus(status);
        ProjectEntity updated = projectRepository.save(project);
        activityLogService.logSafe(userId, updated.getId(), "Project updated", "PROJECT", updated.getId(), "Status changed to " + status);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteProject(UUID userId, UUID id) {
        ProjectEntity project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        // Unlink associated tasks to preserve user work without foreign key violations
        List<TaskEntity> tasks = taskRepository.findByProjectId(id);
        for (TaskEntity task : tasks) {
            task.setProjectId(null);
            taskRepository.save(task);
        }

        // Clean up project git commits
        List<TaskGitCommitEntity> commits = taskGitCommitRepository.findByProjectIdOrderByTimestampDesc(id);
        if (!commits.isEmpty()) {
            taskGitCommitRepository.deleteAll(commits);
        }

        // Clean up milestones and issues
        List<ProjectMilestoneEntity> milestones = projectMilestoneRepository.findByProjectIdOrderByCreatedAtAsc(id);
        if (!milestones.isEmpty()) {
            projectMilestoneRepository.deleteAll(milestones);
        }

        List<ProjectIssueEntity> issues = projectIssueRepository.findByProjectIdOrderByCreatedAtDesc(id);
        if (!issues.isEmpty()) {
            projectIssueRepository.deleteAll(issues);
        }

        projectRepository.delete(project);
    }

    // --- Project Milestones Management ---
    public List<ProjectMilestoneDTO> getProjectMilestones(UUID projectId) {
        return projectMilestoneRepository.findByProjectIdOrderByCreatedAtAsc(projectId)
                .stream().map(this::mapMilestoneToDTO).collect(Collectors.toList());
    }

    @Transactional
    public ProjectMilestoneDTO createProjectMilestone(UUID projectId, ProjectMilestoneRequest request) {
        ProjectMilestoneEntity entity = new ProjectMilestoneEntity(
                projectId,
                request.getTitle().trim(),
                request.getDescription(),
                request.getStatus(),
                request.getDueDate()
        );
        ProjectMilestoneEntity saved = projectMilestoneRepository.save(entity);
        return mapMilestoneToDTO(saved);
    }

    @Transactional
    public ProjectMilestoneDTO updateProjectMilestone(UUID projectId, UUID milestoneId, ProjectMilestoneRequest request) {
        ProjectMilestoneEntity entity = projectMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found with id: " + milestoneId));
        String oldStatus = entity.getStatus();
        entity.setTitle(request.getTitle().trim());
        entity.setDescription(request.getDescription());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getDueDate() != null) entity.setDueDate(request.getDueDate());
        ProjectMilestoneEntity updated = projectMilestoneRepository.save(entity);

        if ("COMPLETED".equalsIgnoreCase(request.getStatus()) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
            projectRepository.findById(projectId).ifPresent(p -> {
                activityLogService.logSafe(p.getUserId(), projectId, "Milestone completed", "MILESTONE", milestoneId, updated.getTitle());
            });
        }

        return mapMilestoneToDTO(updated);
    }

    @Transactional
    public void deleteProjectMilestone(UUID projectId, UUID milestoneId) {
        ProjectMilestoneEntity entity = projectMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found with id: " + milestoneId));
        projectMilestoneRepository.delete(entity);
    }

    // --- Project Issues Management ---
    public List<ProjectIssueDTO> getProjectIssues(UUID projectId) {
        return projectIssueRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::mapIssueToDTO).collect(Collectors.toList());
    }

    @Transactional
    public ProjectIssueDTO createProjectIssue(UUID projectId, ProjectIssueRequest request) {
        ProjectIssueEntity entity = new ProjectIssueEntity(
                projectId,
                request.getTitle().trim(),
                request.getDescription(),
                request.getStatus(),
                request.getPriority(),
                request.getIssueType(),
                request.getTaskId()
        );
        ProjectIssueEntity saved = projectIssueRepository.save(entity);
        return mapIssueToDTO(saved);
    }

    @Transactional
    public ProjectIssueDTO updateProjectIssue(UUID projectId, UUID issueId, ProjectIssueRequest request) {
        ProjectIssueEntity entity = projectIssueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));
        entity.setTitle(request.getTitle().trim());
        entity.setDescription(request.getDescription());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getPriority() != null) entity.setPriority(request.getPriority());
        if (request.getIssueType() != null) entity.setIssueType(request.getIssueType());
        if (request.getTaskId() != null) entity.setTaskId(request.getTaskId());
        ProjectIssueEntity updated = projectIssueRepository.save(entity);
        return mapIssueToDTO(updated);
    }

    @Transactional
    public void deleteProjectIssue(UUID projectId, UUID issueId) {
        ProjectIssueEntity entity = projectIssueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));
        projectIssueRepository.delete(entity);
    }

    @Transactional
    public void linkResourceToProject(UUID userId, UUID projectId, ResourceType resourceType, UUID resourceId) {
        if (resourceType == null || resourceId == null) return;
        switch (resourceType) {
            case NOTE:
                noteRepository.findById(resourceId).ifPresent(note -> {
                    note.setProjectId(projectId);
                    noteRepository.save(note);
                    activityLogService.logSafe(userId, projectId, "Note added", "NOTE", resourceId, note.getTitle());
                });
                break;
            case DOCUMENT:
                documentRepository.findById(resourceId).ifPresent(doc -> {
                    doc.setProjectId(projectId);
                    documentRepository.save(doc);
                    activityLogService.logSafe(userId, projectId, "Document added", "DOCUMENT", resourceId, doc.getName());
                });
                break;
            case WEBSITE:
                websiteRepository.findById(resourceId).ifPresent(web -> {
                    web.setProjectId(projectId);
                    websiteRepository.save(web);
                    activityLogService.logSafe(userId, projectId, "Website added", "WEBSITE", resourceId, web.getName());
                });
                break;
            case DRIVE_LINK:
                driveLinkRepository.findById(resourceId).ifPresent(drive -> {
                    drive.setProjectId(projectId);
                    driveLinkRepository.save(drive);
                    activityLogService.logSafe(userId, projectId, "Drive resource added", "DRIVE_LINK", resourceId, drive.getName());
                });
                break;
            default:
                break;
        }
    }

    @Transactional
    public void unlinkResourceFromProject(UUID userId, UUID projectId, ResourceType resourceType, UUID resourceId) {
        if (resourceType == null || resourceId == null) return;
        switch (resourceType) {
            case NOTE:
                noteRepository.findById(resourceId).ifPresent(note -> {
                    if (projectId.equals(note.getProjectId())) {
                        note.setProjectId(null);
                        noteRepository.save(note);
                        activityLogService.logSafe(userId, projectId, "Note removed", "NOTE", resourceId, note.getTitle());
                    }
                });
                break;
            case DOCUMENT:
                documentRepository.findById(resourceId).ifPresent(doc -> {
                    if (projectId.equals(doc.getProjectId())) {
                        doc.setProjectId(null);
                        documentRepository.save(doc);
                        activityLogService.logSafe(userId, projectId, "Document removed", "DOCUMENT", resourceId, doc.getName());
                    }
                });
                break;
            case WEBSITE:
                websiteRepository.findById(resourceId).ifPresent(web -> {
                    if (projectId.equals(web.getProjectId())) {
                        web.setProjectId(null);
                        websiteRepository.save(web);
                        activityLogService.logSafe(userId, projectId, "Website removed", "WEBSITE", resourceId, web.getName());
                    }
                });
                break;
            case DRIVE_LINK:
                driveLinkRepository.findById(resourceId).ifPresent(drive -> {
                    if (projectId.equals(drive.getProjectId())) {
                        drive.setProjectId(null);
                        driveLinkRepository.save(drive);
                        activityLogService.logSafe(userId, projectId, "Drive resource removed", "DRIVE_LINK", resourceId, drive.getName());
                    }
                });
                break;
            default:
                break;
        }
    }

    private ProjectMilestoneDTO mapMilestoneToDTO(ProjectMilestoneEntity m) {
        return new ProjectMilestoneDTO(
                m.getId(),
                m.getProjectId(),
                m.getTitle(),
                m.getDescription(),
                m.getStatus(),
                m.getDueDate(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }

    private ProjectIssueDTO mapIssueToDTO(ProjectIssueEntity i) {
        String taskKey = null;
        if (i.getTaskId() != null) {
            taskKey = taskRepository.findById(i.getTaskId()).map(TaskEntity::getTaskKey).orElse(null);
        }
        return new ProjectIssueDTO(
                i.getId(),
                i.getProjectId(),
                i.getTitle(),
                i.getDescription(),
                i.getStatus(),
                i.getPriority(),
                i.getIssueType(),
                i.getTaskId(),
                taskKey,
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }

    private String generateProjectKey(String projectName) {
        if (projectName == null || projectName.trim().isEmpty()) return "PRJ";
        String cleaned = projectName.replaceAll("[^a-zA-Z0-9 ]", "").trim();
        String[] words = cleaned.split("\\s+");
        if (words.length >= 2) {
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty()) sb.append(w.charAt(0));
                if (sb.length() >= 4) break;
            }
            return sb.toString().toUpperCase();
        } else if (cleaned.length() >= 3) {
            return cleaned.substring(0, Math.min(4, cleaned.length())).toUpperCase();
        }
        return "PRJ";
    }

    private ProjectDTO mapToDTO(ProjectEntity entity) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setProjectKey(entity.getProjectKey());
        dto.setGithubRepo(entity.getGithubRepo());
        dto.setGithubToken(entity.getGithubToken());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        long taskCount = taskRepository.countByProjectId(entity.getId());
        long completedTasks = taskRepository.countByProjectIdAndStatus(entity.getId(), com.personal.workspace.entity.TaskStatus.COMPLETED);
        dto.setTaskCount(taskCount);
        dto.setCompletedTaskCount(completedTasks);

        if (taskCount > 0) {
            int calcProgress = (int) Math.round(((double) completedTasks / taskCount) * 100);
            dto.setProgress(calcProgress);
        } else {
            dto.setProgress(entity.getProgress());
        }

        return dto;
    }

    // ─── AI Project Assistant ──────────────────────────────────────────────

    /**
     * Handles a user message scoped to a specific project.
     * Builds project context and passes it to Gemini as a system prompt.
     */
    public String chatWithProjectContext(UUID userId, UUID projectId, String message, List<java.util.Map<String, String>> history) {
        ProjectEntity project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        List<com.personal.workspace.entity.TaskEntity> tasks = taskRepository.findByProjectId(projectId);
        List<ProjectMilestoneEntity> milestones = projectMilestoneRepository.findByProjectIdOrderByDueDateAsc(projectId);
        List<ProjectIssueEntity> issues = projectIssueRepository.findByProjectId(projectId);

        StringBuilder ctx = new StringBuilder();
        ctx.append("PROJECT CONTEXT (Known Data — Do NOT fabricate)\n");
        ctx.append("Project: ").append(project.getName()).append("\n");
        ctx.append("Status: ").append(project.getStatus()).append("\n");
        if (project.getDescription() != null) ctx.append("Description: ").append(project.getDescription()).append("\n");
        if (project.getEndDate() != null) ctx.append("Deadline: ").append(project.getEndDate()).append("\n");
        if (project.getGithubRepo() != null) ctx.append("GitHub: ").append(project.getGithubRepo()).append("\n");

        ctx.append("\nTASKS (\n");
        for (com.personal.workspace.entity.TaskEntity t : tasks) {
            ctx.append(" - [").append(t.getTaskKey() != null ? t.getTaskKey() : "").append("] ")
               .append(t.getTitle()).append(" | ").append(t.getStatus())
               .append(" | ").append(t.getPriority());
            if (t.getDueDate() != null) ctx.append(" | Due: ").append(t.getDueDate());
            ctx.append("\n");
        }
        ctx.append(")\n");

        if (!milestones.isEmpty()) {
            ctx.append("\nMILESTONES:\n");
            for (ProjectMilestoneEntity m : milestones) {
                ctx.append(" - ").append(m.getTitle()).append(" | ").append(m.getStatus());
                if (m.getDueDate() != null) ctx.append(" | Due: ").append(m.getDueDate());
                ctx.append("\n");
            }
        }

        if (!issues.isEmpty()) {
            long openIssues = issues.stream().filter(i -> "OPEN".equals(i.getStatus())).count();
            ctx.append("\nOPEN ISSUES: ").append(openIssues).append(" of ").append(issues.size()).append(" total\n");
        }

        String systemPrompt = "You are a helpful, concise developer assistant for project '" + project.getName() + "'.\n"
                + "Use ONLY the following known project data to answer the developer's questions.\n"
                + "Do NOT invent tasks, commits, or milestones not listed below.\n"
                + "Always label AI-generated suggestions as [AI Suggestion].\n\n"
                + ctx;

        // Build full prompt with conversation history
        StringBuilder fullPrompt = new StringBuilder();
        fullPrompt.append(systemPrompt).append("\n\n--- CONVERSATION ---\n");
        if (history != null) {
            for (java.util.Map<String, String> turn : history) {
                String role = turn.getOrDefault("role", "user");
                String content = turn.getOrDefault("content", "");
                fullPrompt.append(role.equals("assistant") ? "Assistant" : "Developer").append(": ").append(content).append("\n");
            }
        }
        fullPrompt.append("Developer: ").append(message).append("\nAssistant:");

        return aiService.callGeminiRaw(fullPrompt.toString());
    }
}

