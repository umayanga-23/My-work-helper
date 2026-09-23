package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class ProjectIssueRequest {
    private UUID projectId;

    @NotBlank(message = "Issue title is required")
    private String title;

    private String description;
    private String status = "OPEN";
    private String priority = "MEDIUM";
    private String issueType = "BUG";
    private UUID taskId;

    public ProjectIssueRequest() {}

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getIssueType() { return issueType; }
    public void setIssueType(String issueType) { this.issueType = issueType; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }
}
