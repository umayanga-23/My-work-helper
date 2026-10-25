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
import java.util.Collections;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
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
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        List<TaskEntity> entities = taskRepository.filterTasks(userId, status, categoryId, projectId, searchPattern);
        return mapToDTOList(entities);
    }

    public List<TaskDTO> getTodayTasks(UUID userId) {
        LocalDate today = LocalDate.now();
        try {
            recurringTaskService.generateInstancesForDate(today, userId);
        } catch (Exception ignored) {}
        List<TaskEntity> entities = taskRepository.findByUserIdAndDueDateOrderByDueTimeAsc(userId, today);
        return mapToDTOList(entities);
    }

    public List<TaskDTO> getTasksForCalendar(UUID userId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : start.plusMonths(1).minusDays(1);
        List<TaskEntity> entities = taskRepository.findByUserIdAndDueDateBetweenOrderByDueDateAscDueTimeAsc(userId, start, end);
        return mapToDTOList(entities);
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
        task.setIsGoal(request.getIsGoal() != null ? request.getIsGoal() : false);

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
        if (request.getIsGoal() != null) task.setIsGoal(request.getIsGoal());

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

    private static class TaskBatchContext {
        Map<UUID, CategoryEntity> categoryMap = Collections.emptyMap();
        Map<UUID, ProjectEntity> projectMap = Collections.emptyMap();
        Map<UUID, TaskEntity> refTaskMap = Collections.emptyMap();
        Map<UUID, RecurringTaskEntity> recurringTaskMap = Collections.emptyMap();
        Map<UUID, List<TaskDependencyEntity>> blockedByMap = Collections.emptyMap();
        Map<UUID, List<TaskDependencyEntity>> blocksMap = Collections.emptyMap();
        Map<UUID, List<TaskGitCommitEntity>> commitsMap = Collections.emptyMap();
        Map<UUID, WebsiteEntity> websiteMap = Collections.emptyMap();
        Map<UUID, NoteEntity> noteMap = Collections.emptyMap();
        Map<UUID, DocumentEntity> docMap = Collections.emptyMap();
        Map<UUID, DriveLinkEntity> driveMap = Collections.emptyMap();
        Map<UUID, IdeaEntity> ideaMap = Collections.emptyMap();
    }

    private TaskBatchContext buildBatchContext(List<TaskEntity> entities) {
        if (entities == null || entities.isEmpty()) {
            return new TaskBatchContext();
        }
        TaskBatchContext ctx = new TaskBatchContext();
        Set<UUID> taskIds = new HashSet<>();
        Set<UUID> categoryIds = new HashSet<>();
        Set<UUID> projectIds = new HashSet<>();
        Set<UUID> refTaskIds = new HashSet<>();
        Set<UUID> recurringTaskIds = new HashSet<>();
        Set<UUID> websiteIds = new HashSet<>();
        Set<UUID> noteIds = new HashSet<>();
        Set<UUID> docIds = new HashSet<>();
        Set<UUID> driveIds = new HashSet<>();
        Set<UUID> ideaIds = new HashSet<>();

        Consumer<TaskEntity> collectEntityIds = (t) -> {
            if (t.getId() != null) taskIds.add(t.getId());
            if (t.getCategoryId() != null) categoryIds.add(t.getCategoryId());
            if (t.getProjectId() != null) projectIds.add(t.getProjectId());
            if (t.getParentTaskId() != null) refTaskIds.add(t.getParentTaskId());
            if (t.getDependsOnTaskId() != null) refTaskIds.add(t.getDependsOnTaskId());
            if (t.getRecurringTaskId() != null) recurringTaskIds.add(t.getRecurringTaskId());
            if (t.getResources() != null) {
                for (TaskResourceEntity r : t.getResources()) {
                    if (r.getResourceType() != null && r.getResourceId() != null) {
                        switch (r.getResourceType()) {
                            case WEBSITE -> websiteIds.add(r.getResourceId());
                            case NOTE -> noteIds.add(r.getResourceId());
                            case DOCUMENT -> docIds.add(r.getResourceId());
                            case DRIVE_LINK -> driveIds.add(r.getResourceId());
                            case IDEA -> ideaIds.add(r.getResourceId());
                            case PROJECT, GITHUB -> projectIds.add(r.getResourceId());
                        }
                    }
                }
            }
        };

        for (TaskEntity entity : entities) {
            collectEntityIds.accept(entity);
            if (entity.getSubtasks() != null) {
                for (TaskEntity sub : entity.getSubtasks()) {
                    collectEntityIds.accept(sub);
                }
            }
        }

        if (!categoryIds.isEmpty()) {
            ctx.categoryMap = categoryRepository.findAllById(categoryIds).stream()
                    .collect(Collectors.toMap(CategoryEntity::getId, c -> c));
        }
        if (!projectIds.isEmpty()) {
            ctx.projectMap = projectRepository.findAllById(projectIds).stream()
                    .collect(Collectors.toMap(ProjectEntity::getId, p -> p));
        }
        if (!recurringTaskIds.isEmpty()) {
            ctx.recurringTaskMap = recurringTaskRepository.findAllById(recurringTaskIds).stream()
                    .collect(Collectors.toMap(RecurringTaskEntity::getId, r -> r));
        }

        // Batch fetch dependencies
        if (!taskIds.isEmpty()) {
            List<TaskDependencyEntity> allBlockedBy = taskDependencyRepository.findByTaskIdIn(taskIds);
            ctx.blockedByMap = allBlockedBy.stream()
                    .collect(Collectors.groupingBy(TaskDependencyEntity::getTaskId));
            for (TaskDependencyEntity dep : allBlockedBy) {
                if (dep.getDependsOnTaskId() != null) {
                    refTaskIds.add(dep.getDependsOnTaskId());
                }
            }

            List<TaskDependencyEntity> allBlocks = taskDependencyRepository.findByDependsOnTaskIdIn(taskIds);
            ctx.blocksMap = allBlocks.stream()
                    .collect(Collectors.groupingBy(TaskDependencyEntity::getDependsOnTaskId));
            for (TaskDependencyEntity dep : allBlocks) {
                if (dep.getTaskId() != null) {
                    refTaskIds.add(dep.getTaskId());
                }
            }

            // Batch fetch git commits
            List<TaskGitCommitEntity> allCommits = taskGitCommitRepository.findByTaskIdInOrderByTimestampDesc(taskIds);
            ctx.commitsMap = allCommits.stream()
                    .collect(Collectors.groupingBy(TaskGitCommitEntity::getTaskId));
        }

        // Batch fetch all referenced tasks (parents, dependencies, blockedBy) in one query
        if (!refTaskIds.isEmpty()) {
            ctx.refTaskMap = taskRepository.findAllById(refTaskIds).stream()
                    .collect(Collectors.toMap(TaskEntity::getId, t -> t));
        }

        // Batch fetch all resources in single queries per type
        if (!websiteIds.isEmpty()) {
            ctx.websiteMap = websiteRepository.findAllById(websiteIds).stream()
                    .collect(Collectors.toMap(WebsiteEntity::getId, w -> w));
        }
        if (!noteIds.isEmpty()) {
            ctx.noteMap = noteRepository.findAllById(noteIds).stream()
                    .collect(Collectors.toMap(NoteEntity::getId, n -> n));
        }
        if (!docIds.isEmpty()) {
            ctx.docMap = documentRepository.findAllById(docIds).stream()
                    .collect(Collectors.toMap(DocumentEntity::getId, d -> d));
        }
        if (!driveIds.isEmpty()) {
            ctx.driveMap = driveLinkRepository.findAllById(driveIds).stream()
                    .collect(Collectors.toMap(DriveLinkEntity::getId, d -> d));
        }
        if (!ideaIds.isEmpty()) {
            ctx.ideaMap = ideaRepository.findAllById(ideaIds).stream()
                    .collect(Collectors.toMap(IdeaEntity::getId, i -> i));
        }

        return ctx;
    }

    private TaskResourceDTO mapResourceToDTO(TaskResourceEntity r, UUID taskId, TaskBatchContext ctx) {
        String title = null;
        String url = null;
        if (r.getResourceType() != null && r.getResourceId() != null) {
            switch (r.getResourceType()) {
                case WEBSITE: {
                    var web = (ctx != null) ? ctx.websiteMap.get(r.getResourceId()) : websiteRepository.findById(r.getResourceId()).orElse(null);
                    if (web != null) {
                        title = web.getName();
                        url = web.getUrl();
                    }
                    break;
                }
                case NOTE: {
                    var note = (ctx != null) ? ctx.noteMap.get(r.getResourceId()) : noteRepository.findById(r.getResourceId()).orElse(null);
                    if (note != null) {
                        title = note.getTitle();
                    }
                    break;
                }
                case DOCUMENT: {
                    var doc = (ctx != null) ? ctx.docMap.get(r.getResourceId()) : documentRepository.findById(r.getResourceId()).orElse(null);
                    if (doc != null) {
                        title = doc.getName();
                        url = doc.getFilePath();
                    }
                    break;
                }
                case DRIVE_LINK: {
                    var drive = (ctx != null) ? ctx.driveMap.get(r.getResourceId()) : driveLinkRepository.findById(r.getResourceId()).orElse(null);
                    if (drive != null) {
                        title = drive.getName();
                        url = drive.getUrl();
                    }
                    break;
                }
                case IDEA: {
                    var idea = (ctx != null) ? ctx.ideaMap.get(r.getResourceId()) : ideaRepository.findById(r.getResourceId()).orElse(null);
                    if (idea != null) {
                        title = idea.getTitle();
                    }
                    break;
                }
                case PROJECT: {
                    var proj = (ctx != null) ? ctx.projectMap.get(r.getResourceId()) : projectRepository.findById(r.getResourceId()).orElse(null);
                    if (proj != null) {
                        title = proj.getName();
                    }
                    break;
                }
                case GITHUB: {
                    var githubProj = (ctx != null) ? ctx.projectMap.get(r.getResourceId()) : projectRepository.findById(r.getResourceId()).orElse(null);
                    if (githubProj != null) {
                        title = (githubProj.getGithubRepo() != null && !githubProj.getGithubRepo().isBlank()) ? githubProj.getGithubRepo() : (githubProj.getName() + " Repository");
                        url = (githubProj.getGithubRepo() != null && !githubProj.getGithubRepo().isBlank()) ? ("https://github.com/" + githubProj.getGithubRepo()) : null;
                    } else {
                        var ghWeb = (ctx != null) ? ctx.websiteMap.get(r.getResourceId()) : websiteRepository.findById(r.getResourceId()).orElse(null);
                        if (ghWeb != null) {
                            title = ghWeb.getName();
                            url = ghWeb.getUrl();
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

    private TaskResourceDTO mapResourceToDTO(TaskResourceEntity r, UUID taskId) {
        return mapResourceToDTO(r, taskId, null);
    }

    public List<TaskDTO> mapToDTOList(List<TaskEntity> entities) {
        if (entities == null || entities.isEmpty()) {
            return Collections.emptyList();
        }
        TaskBatchContext ctx = buildBatchContext(entities);
        return entities.stream().map(e -> mapToDTO(e, ctx)).collect(Collectors.toList());
    }

    private TaskDTO mapToDTO(TaskEntity entity) {
        return mapToDTO(entity, null);
    }

    private TaskDTO mapToDTO(TaskEntity entity, TaskBatchContext ctx) {
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
            TaskEntity dep = (ctx != null) ? ctx.refTaskMap.get(entity.getDependsOnTaskId()) : null;
            if (dep == null && (ctx == null || !ctx.refTaskMap.containsKey(entity.getDependsOnTaskId()))) {
                dep = taskRepository.findById(entity.getDependsOnTaskId()).orElse(null);
            }
            if (dep != null) {
                dto.setDependsOnTaskTitle(dep.getTitle());
                dto.setDependsOnTaskKey(dep.getTaskKey());
            }
        }

        if (entity.getProjectId() != null) {
            ProjectEntity proj = (ctx != null) ? ctx.projectMap.get(entity.getProjectId()) : null;
            if (proj == null && (ctx == null || !ctx.projectMap.containsKey(entity.getProjectId()))) {
                proj = projectRepository.findById(entity.getProjectId()).orElse(null);
            }
            if (proj != null) {
                dto.setProjectName(proj.getName());
            }
        }

        if (entity.getParentTaskId() != null) {
            TaskEntity p = (ctx != null) ? ctx.refTaskMap.get(entity.getParentTaskId()) : null;
            if (p == null && (ctx == null || !ctx.refTaskMap.containsKey(entity.getParentTaskId()))) {
                p = taskRepository.findById(entity.getParentTaskId()).orElse(null);
            }
            if (p != null) {
                dto.setParentTaskTitle(p.getTitle());
                dto.setParentTaskKey(p.getTaskKey());
            }
        }

        if (entity.getCategoryId() != null) {
            CategoryEntity cat = (ctx != null) ? ctx.categoryMap.get(entity.getCategoryId()) : null;
            if (cat == null && (ctx == null || !ctx.categoryMap.containsKey(entity.getCategoryId()))) {
                cat = categoryRepository.findById(entity.getCategoryId()).orElse(null);
            }
            if (cat != null) {
                dto.setCategoryName(cat.getName());
                dto.setCategoryColor(cat.getColor());
            }
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
                subDto.setIsGoal(sub.getIsGoal() != null ? sub.getIsGoal() : false);
                return subDto;
            }).collect(Collectors.toList()));
        }

        if (entity.getResources() != null && !entity.getResources().isEmpty()) {
            List<TaskResourceDTO> resourceDTOs = entity.getResources().stream()
                    .map(r -> mapResourceToDTO(r, entity.getId(), ctx))
                    .collect(Collectors.toList());
            dto.setResources(resourceDTOs);
        }

        // Map many-to-many dependencies using batch context when available
        List<TaskDependencyEntity> blockedByDeps = (ctx != null)
                ? ctx.blockedByMap.getOrDefault(entity.getId(), Collections.emptyList())
                : taskDependencyRepository.findByTaskId(entity.getId());
        if (!blockedByDeps.isEmpty()) {
            List<TaskDependencyRef> blockedByRefs = blockedByDeps.stream()
                .map(dep -> {
                    TaskEntity t = (ctx != null) ? ctx.refTaskMap.get(dep.getDependsOnTaskId()) : null;
                    if (t == null && (ctx == null || !ctx.refTaskMap.containsKey(dep.getDependsOnTaskId()))) {
                        t = taskRepository.findById(dep.getDependsOnTaskId()).orElse(null);
                    }
                    return t != null ? new TaskDependencyRef(t.getId(), t.getTaskKey(), t.getTitle(), t.getStatus()) : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            dto.setBlockedBy(blockedByRefs);
            boolean blocked = blockedByRefs.stream().anyMatch(ref -> ref.status() != TaskStatus.COMPLETED);
            dto.setBlocked(blocked);
        }

        List<TaskDependencyEntity> blocksDeps = (ctx != null)
                ? ctx.blocksMap.getOrDefault(entity.getId(), Collections.emptyList())
                : taskDependencyRepository.findByDependsOnTaskId(entity.getId());
        if (!blocksDeps.isEmpty()) {
            List<TaskDependencyRef> blocksRefs = blocksDeps.stream()
                .map(dep -> {
                    TaskEntity t = (ctx != null) ? ctx.refTaskMap.get(dep.getTaskId()) : null;
                    if (t == null && (ctx == null || !ctx.refTaskMap.containsKey(dep.getTaskId()))) {
                        t = taskRepository.findById(dep.getTaskId()).orElse(null);
                    }
                    return t != null ? new TaskDependencyRef(t.getId(), t.getTaskKey(), t.getTitle(), t.getStatus()) : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            dto.setBlocks(blocksRefs);
        }

        // Map attached Git commits using batch context when available
        List<TaskGitCommitEntity> commits = (ctx != null)
                ? ctx.commitsMap.getOrDefault(entity.getId(), Collections.emptyList())
                : taskGitCommitRepository.findByTaskIdOrderByTimestampDesc(entity.getId());
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
        dto.setIsGoal(entity.getIsGoal() != null ? entity.getIsGoal() : false);
        if (entity.getRecurringTaskId() != null) {
            RecurringTaskEntity r = (ctx != null) ? ctx.recurringTaskMap.get(entity.getRecurringTaskId()) : null;
            if (r == null && (ctx == null || !ctx.recurringTaskMap.containsKey(entity.getRecurringTaskId()))) {
                r = recurringTaskRepository.findById(entity.getRecurringTaskId()).orElse(null);
            }
            if (r != null) {
                dto.setRecurringTaskTitle(r.getTitle());
            }
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
