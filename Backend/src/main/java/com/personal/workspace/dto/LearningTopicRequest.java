package com.personal.workspace.dto;

import com.personal.workspace.entity.TopicStatus;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class LearningTopicRequest {

    @NotBlank(message = "Topic title is required")
    private String title;

    private String description;
    private TopicStatus status = TopicStatus.NOT_STARTED;
    private Integer progressPercent = 0;
    private UUID skillId;

    public LearningTopicRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TopicStatus getStatus() { return status; }
    public void setStatus(TopicStatus status) { this.status = status; }

    public Integer getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }

    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID skillId) { this.skillId = skillId; }
}
