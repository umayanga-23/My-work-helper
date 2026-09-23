package com.personal.workspace.dto;

import java.time.ZonedDateTime;
import java.util.UUID;

public class LearningResourceDTO {
    private UUID id;
    private UUID userId;
    private UUID skillId;
    private UUID topicId;
    private String title;
    private String url;
    private String resourceType;
    private ZonedDateTime createdAt;

    public LearningResourceDTO() {}

    public LearningResourceDTO(UUID id, UUID userId, UUID skillId, UUID topicId, String title, String url, String resourceType, ZonedDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.skillId = skillId;
        this.topicId = topicId;
        this.title = title;
        this.url = url;
        this.resourceType = resourceType;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID skillId) { this.skillId = skillId; }

    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
