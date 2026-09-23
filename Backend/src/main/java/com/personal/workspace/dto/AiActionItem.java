package com.personal.workspace.dto;

import java.util.UUID;

public class AiActionItem {
    private String type; // "CREATE_TASK", "CREATE_PROJECT", "CREATE_NOTE", "UPDATE_TASK_STATUS"
    private String title;
    private String description;
    private String priority;
    private String dueDate;
    private String categoryName;
    private UUID projectId;
    private String projectName;
    private UUID parentTaskId;
    private Integer estimatedDuration;
    private String dependencySuggestion;
    private Integer orderNumber;
    private UUID dependsOnTaskId;

    public AiActionItem() {}

    public AiActionItem(String type, String title, String description, String priority, String dueDate) {
        this.type = type;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public UUID getParentTaskId() { return parentTaskId; }
    public void setParentTaskId(UUID parentTaskId) { this.parentTaskId = parentTaskId; }

    public Integer getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(Integer estimatedDuration) { this.estimatedDuration = estimatedDuration; }

    public String getDependencySuggestion() { return dependencySuggestion; }
    public void setDependencySuggestion(String dependencySuggestion) { this.dependencySuggestion = dependencySuggestion; }

    public Integer getOrderNumber() { return orderNumber; }
    public void setOrderNumber(Integer orderNumber) { this.orderNumber = orderNumber; }

    public UUID getDependsOnTaskId() { return dependsOnTaskId; }
    public void setDependsOnTaskId(UUID dependsOnTaskId) { this.dependsOnTaskId = dependsOnTaskId; }
}
