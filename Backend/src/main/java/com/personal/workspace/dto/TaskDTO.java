package com.personal.workspace.dto;

import com.personal.workspace.entity.TaskPriority;
import com.personal.workspace.entity.TaskStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class TaskDTO {
    private UUID id;
    private UUID userId;
    private UUID projectId;
    private UUID categoryId;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private LocalTime dueTime;
    private ZonedDateTime completedAt;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private String categoryName;
    private String categoryColor;
    private String projectName;
    private String taskKey;
    private UUID parentTaskId;
    private String parentTaskTitle;
    private String parentTaskKey;
    private UUID dependsOnTaskId;
    private String dependsOnTaskTitle;
    private String dependsOnTaskKey;
    private List<TaskDTO> subtasks;
    private List<TaskResourceDTO> resources;
    private List<TaskGitCommitDTO> gitCommits;
    /** Many-to-many: tasks this task depends on (blocked-by) */
    private List<TaskDependencyRef> blockedBy;
    /** Many-to-many: tasks that depend on this task (blocking others) */
    private List<TaskDependencyRef> blocks;
    /** Derived: true when at least one dependsOn task is not COMPLETED */
    private boolean isBlocked;
    private UUID recurringTaskId;
    private Integer estimatedDuration;
    private String recurringTaskTitle;

    public TaskDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public LocalTime getDueTime() { return dueTime; }
    public void setDueTime(LocalTime dueTime) { this.dueTime = dueTime; }

    public ZonedDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(ZonedDateTime completedAt) { this.completedAt = completedAt; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getTaskKey() { return taskKey; }
    public void setTaskKey(String taskKey) { this.taskKey = taskKey; }

    public UUID getParentTaskId() { return parentTaskId; }
    public void setParentTaskId(UUID parentTaskId) { this.parentTaskId = parentTaskId; }

    public UUID getDependsOnTaskId() { return dependsOnTaskId; }
    public void setDependsOnTaskId(UUID dependsOnTaskId) { this.dependsOnTaskId = dependsOnTaskId; }

    public String getDependsOnTaskTitle() { return dependsOnTaskTitle; }
    public void setDependsOnTaskTitle(String dependsOnTaskTitle) { this.dependsOnTaskTitle = dependsOnTaskTitle; }

    public String getDependsOnTaskKey() { return dependsOnTaskKey; }
    public void setDependsOnTaskKey(String dependsOnTaskKey) { this.dependsOnTaskKey = dependsOnTaskKey; }

    public List<TaskDTO> getSubtasks() { return subtasks; }
    public void setSubtasks(List<TaskDTO> subtasks) { this.subtasks = subtasks; }

    public List<TaskResourceDTO> getResources() { return resources; }
    public void setResources(List<TaskResourceDTO> resources) { this.resources = resources; }

    public List<TaskGitCommitDTO> getGitCommits() { return gitCommits; }
    public void setGitCommits(List<TaskGitCommitDTO> gitCommits) { this.gitCommits = gitCommits; }

    public List<TaskDependencyRef> getBlockedBy() { return blockedBy; }
    public void setBlockedBy(List<TaskDependencyRef> blockedBy) { this.blockedBy = blockedBy; }

    public List<TaskDependencyRef> getBlocks() { return blocks; }
    public void setBlocks(List<TaskDependencyRef> blocks) { this.blocks = blocks; }

    public boolean isBlocked() { return isBlocked; }
    public void setBlocked(boolean blocked) { isBlocked = blocked; }

    public UUID getRecurringTaskId() { return recurringTaskId; }
    public void setRecurringTaskId(UUID recurringTaskId) { this.recurringTaskId = recurringTaskId; }

    public Integer getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(Integer estimatedDuration) { this.estimatedDuration = estimatedDuration; }

    public String getRecurringTaskTitle() { return recurringTaskTitle; }
    public void setRecurringTaskTitle(String recurringTaskTitle) { this.recurringTaskTitle = recurringTaskTitle; }

    public String getParentTaskTitle() { return parentTaskTitle; }
    public void setParentTaskTitle(String parentTaskTitle) { this.parentTaskTitle = parentTaskTitle; }

    public String getParentTaskKey() { return parentTaskKey; }
    public void setParentTaskKey(String parentTaskKey) { this.parentTaskKey = parentTaskKey; }
}
