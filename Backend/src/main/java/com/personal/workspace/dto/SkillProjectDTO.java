package com.personal.workspace.dto;

import java.time.ZonedDateTime;
import java.util.UUID;

public class SkillProjectDTO {
    private UUID id;
    private UUID userId;
    private UUID skillId;
    private UUID projectId;
    private String projectName;
    private String projectStatus;
    private int projectProgressPercent;
    private ZonedDateTime createdAt;

    public SkillProjectDTO() {}

    public SkillProjectDTO(UUID id, UUID userId, UUID skillId, UUID projectId, String projectName, String projectStatus, int projectProgressPercent, ZonedDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.skillId = skillId;
        this.projectId = projectId;
        this.projectName = projectName;
        this.projectStatus = projectStatus;
        this.projectProgressPercent = projectProgressPercent;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID skillId) { this.skillId = skillId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getProjectStatus() { return projectStatus; }
    public void setProjectStatus(String projectStatus) { this.projectStatus = projectStatus; }

    public int getProjectProgressPercent() { return projectProgressPercent; }
    public void setProjectProgressPercent(int projectProgressPercent) { this.projectProgressPercent = projectProgressPercent; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
