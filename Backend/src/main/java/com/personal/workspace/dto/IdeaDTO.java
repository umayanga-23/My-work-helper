package com.personal.workspace.dto;

import com.personal.workspace.entity.IdeaStatus;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class IdeaDTO {
    private UUID id;
    private UUID userId;
    private String title;
    private String description;
    private String category;
    private IdeaStatus status;
    private UUID convertedProjectId;
    private List<String> tags;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public IdeaDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public IdeaStatus getStatus() { return status; }
    public void setStatus(IdeaStatus status) { this.status = status; }

    public UUID getConvertedProjectId() { return convertedProjectId; }
    public void setConvertedProjectId(UUID convertedProjectId) { this.convertedProjectId = convertedProjectId; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
