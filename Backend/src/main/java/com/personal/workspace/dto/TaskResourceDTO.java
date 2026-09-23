package com.personal.workspace.dto;

import com.personal.workspace.entity.ResourceType;
import java.time.ZonedDateTime;
import java.util.UUID;

public class TaskResourceDTO {
    private UUID id;
    private UUID taskId;
    private ResourceType resourceType;
    private UUID resourceId;
    private String title;
    private String url;
    private ZonedDateTime createdAt;

    public TaskResourceDTO() {}

    public TaskResourceDTO(UUID id, UUID taskId, ResourceType resourceType, UUID resourceId, String title, String url, ZonedDateTime createdAt) {
        this.id = id;
        this.taskId = taskId;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.title = title;
        this.url = url;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public ResourceType getResourceType() { return resourceType; }
    public void setResourceType(ResourceType resourceType) { this.resourceType = resourceType; }

    public UUID getResourceId() { return resourceId; }
    public void setResourceId(UUID resourceId) { this.resourceId = resourceId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
