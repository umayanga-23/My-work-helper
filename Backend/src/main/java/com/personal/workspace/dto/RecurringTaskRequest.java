package com.personal.workspace.dto;

import com.personal.workspace.entity.RecurrenceType;
import com.personal.workspace.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public class RecurringTaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private UUID projectId;
    private UUID categoryId;
    private TaskPriority priority = TaskPriority.MEDIUM;
    private LocalTime dueTime;
    private Integer estimatedDuration;

    @NotNull(message = "Recurrence type is required")
    private RecurrenceType recurrenceType = RecurrenceType.DAILY;

    private String recurrenceConfig;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    public RecurringTaskRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

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
}
