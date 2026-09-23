package com.personal.workspace.dto;

import java.time.ZonedDateTime;
import java.util.UUID;

public class ActivityLogDTO {
    private UUID id;
    private UUID userId;
    private UUID projectId;
    private String action;
    private String entityType;
    private UUID entityId;
    private String metadata;
    private ZonedDateTime createdAt;

    public ActivityLogDTO() {}

    public ActivityLogDTO(UUID id, UUID userId, String action, String entityType, UUID entityId, String metadata, ZonedDateTime createdAt) {
        this(id, userId, null, action, entityType, entityId, metadata, createdAt);
    }

    public ActivityLogDTO(UUID id, UUID userId, UUID projectId, String action, String entityType, UUID entityId, String metadata, ZonedDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.projectId = projectId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.metadata = metadata;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
