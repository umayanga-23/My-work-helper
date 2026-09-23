package com.personal.workspace.service;

import com.personal.workspace.dto.*;
import com.personal.workspace.entity.*;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.TaskRepository;
import com.personal.workspace.repository.TaskDependencyRepository;
import com.personal.workspace.repository.TaskResourceRepository;
import com.personal.workspace.repository.WebsiteRepository;
import com.personal.workspace.repository.NoteRepository;
import com.personal.workspace.repository.DocumentRepository;
import com.personal.workspace.repository.DriveLinkRepository;
import com.personal.workspace.repository.IdeaRepository;
import com.personal.workspace.repository.ProjectRepository;
import com.personal.workspace.repository.RecurringTaskRepository;
import com.personal.workspace.repository.TaskGitCommitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final TaskResourceRepository taskResourceRepository;
    private final ProjectRepository projectRepository;
    private final TaskGitCommitRepository taskGitCommitRepository;
    private final TaskDependencyRepository taskDependencyRepository;
    private final WebsiteRepository websiteRepository;
    private final NoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final DriveLinkRepository driveLinkRepository;
    private final IdeaRepository ideaRepository;
    private final ActivityLogService activityLogService;
    private final RecurringTaskRepository recurringTaskRepository;
    private final RecurringTaskService recurringTaskService;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public TaskService(TaskRepository taskRepository,
                       CategoryRepository categoryRepository,
                       TaskResourceRepository taskResourceRepository,
                       ProjectRepository projectRepository,
                       TaskGitCommitRepository taskGitCommitRepository,
                       TaskDependencyRepository taskDependencyRepository,
                       WebsiteRepository websiteRepository,
                       NoteRepository noteRepository,
                       DocumentRepository documentRepository,
                       DriveLinkRepository driveLinkRepository,
                       IdeaRepository ideaRepository,
                       ActivityLogService activityLogService,
                       RecurringTaskRepository recurringTaskRepository,
                       RecurringTaskService recurringTaskService) {
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
        this.taskResourceRepository = taskResourceRepository;
        this.projectRepository = projectRepository;
        this.taskGitCommitRepository = taskGitCommitRepository;
        this.taskDependencyRepository = taskDependencyRepository;
        this.websiteRepository = websiteRepository;
        this.noteRepository = noteRepository;
        this.documentRepository = documentRepository;
        this.driveLinkRepository = driveLinkRepository;
        this.ideaRepository = ideaRepository;
        this.activityLogService = activityLogService;
        this.recurringTaskRepository = recurringTaskRepository;
        this.recurringTaskService = recurringTaskService;
    }

    public List<TaskDTO> getTasks(UUID userId, TaskStatus status, UUID categoryId, UUID projectId, String search) {
        List<TaskEntity> entities = taskRepository.filterTasks(userId, status, categoryId, projectId, search);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TaskDTO> getTodayTasks(UUID userId) {
        LocalDate today = LocalDate.now();
        try {
            recurringTaskService.generateInstancesForDate(today, userId);
        } catch (Exception ignored) {}
        List<TaskEntity> entities = taskRepository.findByUserIdAndDueDateOrderByDueTimeAsc(userId, today);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksForCalendar(UUID userId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : start.plusMonths(1).minusDays(1);
        List<TaskEntity> entities = taskRepository.findByUserIdAndDueDateBetweenOrderByDueDateAscDueTimeAsc(userId, start, end);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public TaskDTO getTaskById(UUID userId, UUID id) {
        TaskEntity entity = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public TaskDTO createTask(UUID userId, TaskRequest request) {
        TaskEntity task = new TaskEntity();
        task.setUserId(userId);
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO);
        task.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        task.setDueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now());
        task.setDueTime(request.getDueTime());
        task.setCategoryId(request.getCategoryId());
        task.setProjectId(request.getProjectId());
        if (request.getParentTaskId() != null) {
            TaskEntity parent = taskRepository.findByIdAndUserId(request.getParentTaskId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent task not found with id: " + request.getParentTaskId()));
            task.setParentTaskId(parent.getId());
            if (task.getProjectId() == null) {
                task.setProjectId(parent.getProjectId());
            }
            if (task.getCategoryId() == null) {
                task.setCategoryId(parent.getCategoryId());
            }
        } else {
            task.setParentTaskId(null);
        }
        task.setDependsOnTaskId(request.getDependsOnTaskId());
        task.setRecurringTaskId(request.getRecurringTaskId());
        task.setEstimatedDuration(request.getEstimatedDuration());

        // Generate Jira-style Task Key (e.g. AIU-1 or PRJ-1)
        if (task.getProjectId() != null) {
            projectRepository.findById(task.getProjectId()).ifPresent(proj -> {
                String prefix = proj.getProjectKey() != null && !proj.getProjectKey().trim().isEmpty() 
                        ? proj.getProjectKey() : "AIU";
                long count = taskRepository.countByProjectId(proj.getId()) + 1;
                task.setTaskKey(prefix.toUpperCase().trim() + "-" + count);
            });
        } else {
            long count = taskRepository.countByUserId(userId) + 1;
            task.setTaskKey("AIU-" + count);
        }

        TaskEntity saved = taskRepository.save(task);
        activityLogService.logSafe(userId, saved.getProjectId(), "Task created", "TASK", saved.getId(), saved.getTitle());
        return mapToDTO(saved);
    }

    @Transactional
    public TaskDTO createSubtask(UUID userId, UUID parentTaskId, TaskRequest request) {
        TaskEntity parent = taskRepository.findByIdAndUserId(parentTaskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent task not found with id: " + parentTaskId));
        request.setParentTaskId(parentTaskId);
        if (request.getProjectId() == null) {
            request.setProjectId(parent.getProjectId());
        }
        if (request.getCategoryId() == null) {
            request.setCategoryId(parent.getCategoryId());
        }
        return createTask(userId, request);
    }

    @Transactional
    public TaskDTO updateTask(UUID userId, UUID id, TaskRequest request) {
        TaskEntity task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        TaskStatus oldStatus = task.getStatus();
        TaskPriority oldPriority = task.getPriority();
        LocalDate oldDueDate = task.getDueDate();
        LocalTime oldDueTime = task.getDueTime();

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            if (request.getStatus() == TaskStatus.COMPLETED) {
                task.setCompletedAt(ZonedDateTime.now());
            } else if (oldStatus == TaskStatus.COMPLETED) {
                task.setCompletedAt(null);
            }
        }
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        task.setDueTime(request.getDueTime());
        task.setCategoryId(request.getCategoryId());
        task.setProjectId(request.getProjectId());
        if (request.getParentTaskId() != null) {
            if (request.getParentTaskId().equals(task.getId())) {
                throw new IllegalArgumentException("A task cannot be its own parent.");
            }
            TaskEntity parent = taskRepository.findByIdAndUserId(request.getParentTaskId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent task not found with id: " + request.getParentTaskId()));
            task.setParentTaskId(parent.getId());
            if (task.getProjectId() == null) {
                task.setProjectId(parent.getProjectId());
            }
        }
        if (request.getDependsOnTaskId() != null) task.setDependsOnTaskId(request.getDependsOnTaskId());

        TaskEntity updated = taskRepository.save(task);

        // 1. Priority changed
        if (request.getPriority() != null && request.getPriority() != oldPriority) {
            String fromP = oldPriority != null ? formatPriorityName(oldPriority) : "None";
            String toP = formatPriorityName(request.getPriority());
            activityLogService.logSafe(userId, updated.getProjectId(), "Priority changed", "TASK", updated.getId(), fromP + " \u2192 " + toP);
        }

        // 2. Due time changed
        if (request.getDueTime() != null && !Objects.equals(request.getDueTime(), oldDueTime)) {
            String fromT = oldDueTime != null ? formatLocalTime(oldDueTime) : "None";
            String toT = formatLocalTime(request.getDueTime());
            activityLogService.logSafe(userId, updated.getProjectId(), "Due time changed", "TASK", updated.getId(), fromT + " \u2192 " + toT);
        }

        // 3. Due date changed
        if (request.getDueDate() != null && !Objects.equals(request.getDueDate(), oldDueDate)) {
            String fromD = oldDueDate != null ? oldDueDate.toString() : "None";
            String toD = request.getDueDate().toString();
            activityLogService.logSafe(userId, updated.getProjectId(), "Due date changed", "TASK", updated.getId(), fromD + " \u2192 " + toD);
        }

        // 4. Status change transitions (Completed, Reopened, Started, or Status changed)
        if (request.getStatus() != null && request.getStatus() != oldStatus) {
            if (request.getStatus() == TaskStatus.COMPLETED) {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task completed", "TASK", updated.getId(), updated.getTitle());
            } else if (oldStatus == TaskStatus.COMPLETED) {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task reopened", "TASK", updated.getId(), updated.getTitle());
            } else if (request.getStatus() == TaskStatus.IN_PROGRESS) {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task started", "TASK", updated.getId(), updated.getTitle());
            } else {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task status changed", "TASK", updated.getId(), oldStatus + " \u2192 " + request.getStatus());
            }
        }

        return mapToDTO(updated);
    }

    @Transactional
    public TaskDTO updateTaskStatus(UUID userId, UUID id, TaskStatus status) {
        TaskEntity task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        TaskStatus oldStatus = task.getStatus();
        task.setStatus(status);
        if (status == TaskStatus.COMPLETED) {
            task.setCompletedAt(ZonedDateTime.now());
        } else if (oldStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }
        TaskEntity updated = taskRepository.save(task);

        if (status != oldStatus) {
            if (status == TaskStatus.COMPLETED) {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task completed", "TASK", updated.getId(), updated.getTitle());
            } else if (oldStatus == TaskStatus.COMPLETED) {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task reopened", "TASK", updated.getId(), updated.getTitle());
            } else if (status == TaskStatus.IN_PROGRESS) {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task started", "TASK", updated.getId(), updated.getTitle());
            } else {
                activityLogService.logSafe(userId, updated.getProjectId(), "Task status changed", "TASK", updated.getId(), oldStatus + " \u2192 " + status);
            }
        }

        return mapToDTO(updated);
    }

    @Transactional
    public TaskDTO rescheduleTaskToToday(UUID userId, UUID id) {
        TaskEntity task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        if (task.getDueDate() != null && task.getDueDate().isEqual(LocalDate.now())) {
            return mapToDTO(task);
        }
        LocalDate oldDate = task.getDueDate();
        task.setDueDate(LocalDate.now());
        TaskEntity updated = taskRepository.save(task);
        String diff = oldDate != null ? (oldDate + " \u2192 " + LocalDate.now()) : ("Rescheduled to " + LocalDate.now());
        activityLogService.logSafe(userId, updated.getProjectId(), "Task rescheduled", "TASK", updated.getId(), diff);
        return mapToDTO(updated);
    }

    public List<ActivityLogDTO> getTaskActivity(UUID userId, UUID taskId) {
        taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        return activityLogService.getEntityActivities(taskId);
    }

    public List<TaskDTO> getOverdueTasks(UUID userId) {
        LocalDate today = LocalDate.now();
        java.time.LocalTime nowTime = java.time.LocalTime.now();
        List<TaskEntity> overduePast = taskRepository.findByUserIdAndDueDateBeforeAndStatusNotOrderByDueDateAscDueTimeAsc(userId, today, TaskStatus.COMPLETED);
        List<TaskEntity> todayTasks = taskRepository.findByUserIdAndDueDateOrderByDueTimeAsc(userId, today);
        List<TaskEntity> allOverdue = new ArrayList<>(overduePast);
        for (TaskEntity t : todayTasks) {
            if (t.getStatus() != TaskStatus.COMPLETED && t.getDueTime() != null && t.getDueTime().isBefore(nowTime)) {
                allOverdue.add(t);
            }
        }
        return allOverdue.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public void deleteTask(UUID userId, UUID id) {
        TaskEntity task = taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        // Gather IDs of this task and all its subtasks for safe cascading unlinking
        List<UUID> targetIds = new ArrayList<>();
        targetIds.add(id);
        if (task.getSubtasks() != null) {
            for (TaskEntity sub : task.getSubtasks()) {
                if (sub.getId() != null) {
                    targetIds.add(sub.getId());
                }
            }
        }

        for (UUID targetId : targetIds) {
            // Remove dependency records
            taskDependencyRepository.deleteByTaskIdOrDependsOnTaskId(targetId, targetId);

            // Unlink any other tasks that reference targetId in depends_on_task_id column
            if (entityManager != null) {
                entityManager.createQuery("UPDATE TaskEntity t SET t.dependsOnTaskId = null WHERE t.dependsOnTaskId = :tid")
                        .setParameter("tid", targetId)
                        .executeUpdate();

                // Unlink any project issues linked to this task
                entityManager.createQuery("UPDATE ProjectIssueEntity p SET p.taskId = null WHERE p.taskId = :tid")
                        .setParameter("tid", targetId)
                        .executeUpdate();
            }

            // Unlink git commits from this task so project commit history is preserved
            List<TaskGitCommitEntity> commits = taskGitCommitRepository.findByTaskIdOrderByTimestampDesc(targetId);
            for (TaskGitCommitEntity commit : commits) {
                commit.setTaskId(null);
                taskGitCommitRepository.save(commit);
            }
        }

        taskRepository.delete(task);
    }

    // ─── Dependency Management ────────────────────────────────────────────────

    /**
     * Add a dependency: taskId will be blocked until dependsOnId is COMPLETED.
     * Prevents circular dependencies (BFS traversal check).
     */
    @Transactional
    public void addDependency(UUID userId, UUID taskId, UUID dependsOnId) {
        taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        taskRepository.findById(dependsOnId)
                .orElseThrow(() -> new ResourceNotFoundException("Dependency task not found: " + dependsOnId));

        if (taskId.equals(dependsOnId)) {
            throw new IllegalArgumentException("A task cannot depend on itself.");
        }
        // Circular check: does dependsOnId already (directly or transitively) depend on taskId?
        if (wouldCreateCycle(taskId, dependsOnId)) {
            throw new IllegalArgumentException("Adding this dependency would create a circular dependency.");
        }
        // Duplicate check
        if (taskDependencyRepository.findByTaskIdAndDependsOnTaskId(taskId, dependsOnId).isPresent()) {
            throw new IllegalArgumentException("This dependency already exists.");
        }
        taskDependencyRepository.save(new TaskDependencyEntity(taskId, dependsOnId));
    }

    @Transactional
    public void removeDependency(UUID userId, UUID taskId, UUID dependsOnId) {
        taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        taskDependencyRepository.deleteByTaskIdAndDependsOnTaskId(taskId, dependsOnId);
    }

    /** BFS: starting from 'startId', check if we can reach 'targetId' by following dependsOn edges */
    private boolean wouldCreateCycle(UUID startId, UUID targetId) {
        // If adding: startId depends on targetId
        // Cycle if: targetId (directly or transitively) depends on startId
        Set<UUID> visited = new HashSet<>();
        Deque<UUID> queue = new ArrayDeque<>();
        queue.add(targetId);
        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            if (current.equals(startId)) return true;
            if (visited.add(current)) {
                List<UUID> nexts = taskDependencyRepository.findDirectDependsOnIds(current);
                queue.addAll(nexts);
            }
        }
        return false;
    }

    @Transactional
    public TaskResourceDTO addResourceToTask(UUID userId, UUID taskId, ResourceType resourceType, UUID resourceId) {
        TaskEntity task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        List<TaskResourceEntity> existing = taskResourceRepository.findByTaskId(taskId);
        for (TaskResourceEntity r : existing) {
            if (r.getResourceType() == resourceType && r.getResourceId().equals(resourceId)) {
                return mapResourceToDTO(r, taskId);
            }
        }

        TaskResourceEntity resource = new TaskResourceEntity(task, resourceType, resourceId);
        TaskResourceEntity saved = taskResourceRepository.save(resource);
        return mapResourceToDTO(saved, taskId);
    }

    @Transactional
    public void deleteResourceFromTask(UUID userId, UUID taskId, UUID resourceLinkId) {
        taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        TaskResourceEntity resource = taskResourceRepository.findById(resourceLinkId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource link not found with id: " + resourceLinkId));
        if (!resource.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Resource link does not belong to this task");
        }
        taskResourceRepository.delete(resource);
    }

    public TaskSummaryDTO getTodaySummary(UUID userId) {
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        // Calculate Monday to Sunday of current calendar week
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1 = Monday, 7 = Sunday
        LocalDate weekStart = today.minusDays(dayOfWeek - 1);
        LocalDate weekEnd = weekStart.plusDays(6);

        List<TaskEntity> allTasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);

        long archivedTasks = 0;
        long totalTasks = 0;
        long completedTasks = 0;
        long inProgressTasks = 0;
        long overdueTasks = 0;

        long todayTotalTasks = 0;
        long todayCompletedTasks = 0;

        long weeklyTotalTasks = 0;
        long weeklyCompletedTasks = 0;

        long estimatedWorkloadMinutes = 0;

        for (TaskEntity t : allTasks) {
            // Archived / Cancelled tasks are strictly excluded from active counts
            if (t.getStatus() == TaskStatus.CANCELLED) {
                archivedTasks++;
                continue;
            }

            totalTasks++;
            boolean isCompleted = t.getStatus() == TaskStatus.COMPLETED;
            if (isCompleted) {
                completedTasks++;
            } else {
                if (t.getStatus() == TaskStatus.IN_PROGRESS) {
                    inProgressTasks++;
                }

                // Check overdue
                if (t.getDueDate() != null) {
                    if (t.getDueDate().isBefore(today)) {
                        overdueTasks++;
                    } else if (t.getDueDate().isEqual(today) && t.getDueTime() != null && t.getDueTime().isBefore(nowTime)) {
                        overdueTasks++;
                    }
                }

                if (t.getEstimatedDuration() != null && t.getEstimatedDuration() > 0) {
                    estimatedWorkloadMinutes += t.getEstimatedDuration();
                }
            }

            // Today metrics
            if (t.getDueDate() != null && t.getDueDate().isEqual(today)) {
                todayTotalTasks++;
                if (isCompleted) {
                    todayCompletedTasks++;
                }
            }

            // Weekly metrics (Monday through Sunday)
            if (t.getDueDate() != null && !t.getDueDate().isBefore(weekStart) && !t.getDueDate().isAfter(weekEnd)) {
                weeklyTotalTasks++;
                if (isCompleted) {
                    weeklyCompletedTasks++;
                }
            }
        }

        long remainingTasks = Math.max(0, totalTasks - completedTasks);
        double completionPercentage = totalTasks > 0 ? Math.round(((double) completedTasks / totalTasks) * 100.0) : 0.0;
        double todayPercentage = todayTotalTasks > 0 ? Math.round(((double) todayCompletedTasks / todayTotalTasks) * 100.0) : 0.0;
        double weeklyPercentage = weeklyTotalTasks > 0 ? Math.round(((double) weeklyCompletedTasks / weeklyTotalTasks) * 100.0) : 0.0;

        String formattedWorkload = formatWorkloadDuration(estimatedWorkloadMinutes);

        return new TaskSummaryDTO(
                totalTasks, completedTasks, remainingTasks,
                overdueTasks, inProgressTasks, completionPercentage,
                todayTotalTasks, todayCompletedTasks, todayPercentage,
                weeklyTotalTasks, weeklyCompletedTasks, weeklyPercentage,
                estimatedWorkloadMinutes, formattedWorkload,
                archivedTasks
        );
    }

    private String formatWorkloadDuration(long totalMinutes) {
        if (totalMinutes <= 0) return "0m";
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        if (hours > 0 && minutes > 0) {
            return hours + "h " + minutes + "m";
        }
        if (hours > 0) {
            return hours + "h";
        }
        return minutes + "m";
    }

    private TaskResourceDTO mapResourceToDTO(TaskResourceEntity r, UUID taskId) {
        String title = null;
        String url = null;
        if (r.getResourceType() != null && r.getResourceId() != null) {
            switch (r.getResourceType()) {
                case WEBSITE: {
                    var webOpt = websiteRepository.findById(r.getResourceId());
                    if (webOpt.isPresent()) {
                        title = webOpt.get().getName();
                        url = webOpt.get().getUrl();
                    }
                    break;
                }
                case NOTE: {
                    var noteOpt = noteRepository.findById(r.getResourceId());
                    if (noteOpt.isPresent()) {
                        title = noteOpt.get().getTitle();
                    }
                    break;
                }
                case DOCUMENT: {
                    var docOpt = documentRepository.findById(r.getResourceId());
                    if (docOpt.isPresent()) {
                        title = docOpt.get().getName();
                        url = docOpt.get().getFilePath();
                    }
                    break;
                }
                case DRIVE_LINK: {
                    var driveOpt = driveLinkRepository.findById(r.getResourceId());
                    if (driveOpt.isPresent()) {
                        title = driveOpt.get().getName();
                        url = driveOpt.get().getUrl();
                    }
                    break;
                }
                case IDEA: {
                    var ideaOpt = ideaRepository.findById(r.getResourceId());
                    if (ideaOpt.isPresent()) {
                        title = ideaOpt.get().getTitle();
                    }
                    break;
                }
                case PROJECT: {
                    var projOpt = projectRepository.findById(r.getResourceId());
                    if (projOpt.isPresent()) {
                        title = projOpt.get().getName();
                    }
                    break;
                }
                case GITHUB: {
                    var githubProjOpt = projectRepository.findById(r.getResourceId());
                    if (githubProjOpt.isPresent()) {
                        var p = githubProjOpt.get();
                        title = (p.getGithubRepo() != null && !p.getGithubRepo().isBlank()) ? p.getGithubRepo() : (p.getName() + " Repository");
                        url = (p.getGithubRepo() != null && !p.getGithubRepo().isBlank()) ? ("https://github.com/" + p.getGithubRepo()) : null;
                    } else {
                        var ghWebOpt = websiteRepository.findById(r.getResourceId());
                        if (ghWebOpt.isPresent()) {
                            title = ghWebOpt.get().getName();
                            url = ghWebOpt.get().getUrl();
                        } else if (taskId != null) {
                            taskRepository.findById(taskId).ifPresent(t -> {
                                if (t.getProjectId() != null) {
                                    projectRepository.findById(t.getProjectId()).ifPresent(p -> {
                                        if (p.getGithubRepo() != null && !p.getGithubRepo().isBlank()) {
                                            // fallback to parent project's repo
                                        }
                                    });
                                }
                            });
                        }
                    }
                    if (title == null || title.startsWith("Resource")) {
                        title = "GitHub Repository";
                    }
                    break;
                }
                default:
                    break;
            }
        }
        if (title == null || title.isBlank()) {
            title = (r.getResourceType() != null ? r.getResourceType().name() : "Resource") + " [Resource unavailable or removed]";
        }
        return new TaskResourceDTO(r.getId(), taskId, r.getResourceType(), r.getResourceId(), title, url, r.getCreatedAt());
    }

    private TaskDTO mapToDTO(TaskEntity entity) {
        TaskDTO dto = new TaskDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setProjectId(entity.getProjectId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setPriority(entity.getPriority());
        dto.setDueDate(entity.getDueDate());
        dto.setDueTime(entity.getDueTime());
        dto.setCompletedAt(entity.getCompletedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        dto.setTaskKey(entity.getTaskKey());
        dto.setParentTaskId(entity.getParentTaskId());
        dto.setDependsOnTaskId(entity.getDependsOnTaskId());

        if (entity.getDependsOnTaskId() != null) {
            taskRepository.findById(entity.getDependsOnTaskId()).ifPresent(dep -> {
                dto.setDependsOnTaskTitle(dep.getTitle());
                dto.setDependsOnTaskKey(dep.getTaskKey());
            });
        }

        if (entity.getProjectId() != null) {
            projectRepository.findById(entity.getProjectId()).ifPresent(proj -> {
                dto.setProjectName(proj.getName());
            });
        }

        if (entity.getParentTaskId() != null) {
            taskRepository.findById(entity.getParentTaskId()).ifPresent(p -> {
                dto.setParentTaskTitle(p.getTitle());
                dto.setParentTaskKey(p.getTaskKey());
            });
        }

        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
                dto.setCategoryColor(cat.getColor());
            });
        }

        if (entity.getSubtasks() != null && !entity.getSubtasks().isEmpty()) {
            dto.setSubtasks(entity.getSubtasks().stream().map(sub -> {
                TaskDTO subDto = new TaskDTO();
                subDto.setId(sub.getId());
                subDto.setUserId(sub.getUserId());
                subDto.setParentTaskId(sub.getParentTaskId());
                subDto.setParentTaskTitle(entity.getTitle());
                subDto.setParentTaskKey(entity.getTaskKey());
                subDto.setTitle(sub.getTitle());
                subDto.setDescription(sub.getDescription());
                subDto.setStatus(sub.getStatus());
                subDto.setPriority(sub.getPriority());
                subDto.setDueDate(sub.getDueDate());
                subDto.setDueTime(sub.getDueTime());
                subDto.setTaskKey(sub.getTaskKey());
                subDto.setCompletedAt(sub.getCompletedAt());
                subDto.setCreatedAt(sub.getCreatedAt());
                subDto.setUpdatedAt(sub.getUpdatedAt());
                subDto.setProjectId(sub.getProjectId() != null ? sub.getProjectId() : entity.getProjectId());
                subDto.setProjectName(dto.getProjectName());
                subDto.setCategoryId(sub.getCategoryId());
                subDto.setEstimatedDuration(sub.getEstimatedDuration());
                subDto.setRecurringTaskId(sub.getRecurringTaskId());
                return subDto;
            }).collect(Collectors.toList()));
        }

        if (entity.getResources() != null && !entity.getResources().isEmpty()) {
            List<TaskResourceDTO> resourceDTOs = entity.getResources().stream()
                    .map(r -> mapResourceToDTO(r, entity.getId()))
                    .collect(Collectors.toList());
            dto.setResources(resourceDTOs);
        }

        // Map many-to-many dependencies
        List<TaskDependencyEntity> blockedByDeps = taskDependencyRepository.findByTaskId(entity.getId());
        if (!blockedByDeps.isEmpty()) {
            List<TaskDependencyRef> blockedByRefs = blockedByDeps.stream()
                .map(dep -> taskRepository.findById(dep.getDependsOnTaskId()).map(t ->
                    new TaskDependencyRef(t.getId(), t.getTaskKey(), t.getTitle(), t.getStatus())
                ).orElse(null))
                .filter(ref -> ref != null)
                .collect(Collectors.toList());
            dto.setBlockedBy(blockedByRefs);
            boolean blocked = blockedByRefs.stream().anyMatch(ref -> ref.status() != TaskStatus.COMPLETED);
            dto.setBlocked(blocked);
        }
        List<TaskDependencyEntity> blocksDeps = taskDependencyRepository.findByDependsOnTaskId(entity.getId());
        if (!blocksDeps.isEmpty()) {
            List<TaskDependencyRef> blocksRefs = blocksDeps.stream()
                .map(dep -> taskRepository.findById(dep.getTaskId()).map(t ->
                    new TaskDependencyRef(t.getId(), t.getTaskKey(), t.getTitle(), t.getStatus())
                ).orElse(null))
                .filter(ref -> ref != null)
                .collect(Collectors.toList());
            dto.setBlocks(blocksRefs);
        }

        // Map attached Git commits
        List<TaskGitCommitEntity> commits = taskGitCommitRepository.findByTaskIdOrderByTimestampDesc(entity.getId());
        if (commits != null && !commits.isEmpty()) {
            dto.setGitCommits(commits.stream().map(c -> {
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
            }).collect(Collectors.toList()));
        }

        dto.setRecurringTaskId(entity.getRecurringTaskId());
        dto.setEstimatedDuration(entity.getEstimatedDuration());
        if (entity.getRecurringTaskId() != null) {
            recurringTaskRepository.findById(entity.getRecurringTaskId()).ifPresent(r -> {
                dto.setRecurringTaskTitle(r.getTitle());
            });
        }

        return dto;
    }

    private String formatPriorityName(TaskPriority priority) {
        if (priority == null) return "None";
        switch (priority) {
            case URGENT: return "Urgent";
            case HIGH: return "High";
            case MEDIUM: return "Medium";
            case LOW: return "Low";
            default: return priority.name();
        }
    }

    private String formatLocalTime(LocalTime time) {
        if (time == null) return "";
        int hour = time.getHour();
        int minute = time.getMinute();
        String ampm = hour >= 12 ? "PM" : "AM";
        int h12 = hour % 12 == 0 ? 12 : hour % 12;
        return String.format("%d:%02d %s", h12, minute, ampm);
    }
}
