package com.personal.workspace.dto;

import com.personal.workspace.entity.RecurrenceType;
import com.personal.workspace.entity.RecurringTaskStatus;
import com.personal.workspace.entity.TaskPriority;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.UUID;

public class RecurringTaskDTO {
    private UUID id;
    private UUID userId;
    private String title;
    private String description;
    private UUID projectId;
    private String projectName;
    private UUID categoryId;
    private String categoryName;
    private String categoryColor;
    private TaskPriority priority;
    private LocalTime dueTime;
    private Integer estimatedDuration;
    private RecurrenceType recurrenceType;
    private String recurrenceConfig;
    private LocalDate startDate;
    private LocalDate endDate;
    private RecurringTaskStatus status;
    private LocalDate lastGeneratedDate;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public RecurringTaskDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public LocalTime getDueTime() { return dueTime; }
    public void setDueTime(LocalTime dueTime) { this.dueTime = dueTime; }

    public Integer getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(Integer estimatedDuration) { this.estimatedDuration = estimatedDuration; }

    public RecurrenceType getRecurrenceType() { return recurrenceType; }
    public void setRecurrenceType(RecurrenceType recurrenceType) { this.recurrenceType = recurrenceType; }

    public String getRecurrenceConfig() { return recurrenceConfig; }
    public void setRecurrenceConfig(String recurrenceConfig) { this.recurrenceConfig = recurrenceConfig; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public RecurringTaskStatus getStatus() { return status; }
    public void setStatus(RecurringTaskStatus status) { this.status = status; }

    public LocalDate getLastGeneratedDate() { return lastGeneratedDate; }
    public void setLastGeneratedDate(LocalDate lastGeneratedDate) { this.lastGeneratedDate = lastGeneratedDate; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
