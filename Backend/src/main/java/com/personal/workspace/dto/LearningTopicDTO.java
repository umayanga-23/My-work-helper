package com.personal.workspace.dto;

import com.personal.workspace.entity.TopicStatus;
import java.time.ZonedDateTime;
import java.util.UUID;

public class LearningTopicDTO {
    private UUID id;
    private UUID userId;
    private UUID skillId;
    private String title;
    private String description;
    private String notes;
    private String cheatsheet;
    private TopicStatus status;
    private int progressPercent;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private java.util.List<LearningResourceDTO> resources;

    public LearningTopicDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID skillId) { this.skillId = skillId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCheatsheet() { return cheatsheet; }
    public void setCheatsheet(String cheatsheet) { this.cheatsheet = cheatsheet; }

    public java.util.List<LearningResourceDTO> getResources() { return resources; }
    public void setResources(java.util.List<LearningResourceDTO> resources) { this.resources = resources; }

    public TopicStatus getStatus() { return status; }
    public void setStatus(TopicStatus status) { this.status = status; }

    public int getProgressPercent() { return progressPercent; }
    public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
