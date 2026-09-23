package com.personal.workspace.dto;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

public class SkillDTO {
    private UUID id;
    private UUID userId;
    private String name;
    private String category;
    private int proficiencyPercent;
    private String targetLevel;
    private String notes;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private List<LearningTopicDTO> topics;
    private List<LearningResourceDTO> resources;
    private List<SkillCertificateDTO> certificates;
    private List<SkillProjectDTO> projects;
    private long totalStudyMinutes;

    public SkillDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getProficiencyPercent() { return proficiencyPercent; }
    public void setProficiencyPercent(int proficiencyPercent) { this.proficiencyPercent = proficiencyPercent; }

    public String getTargetLevel() { return targetLevel; }
    public void setTargetLevel(String targetLevel) { this.targetLevel = targetLevel; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<LearningTopicDTO> getTopics() { return topics; }
    public void setTopics(List<LearningTopicDTO> topics) { this.topics = topics; }

    public List<LearningResourceDTO> getResources() { return resources; }
    public void setResources(List<LearningResourceDTO> resources) { this.resources = resources; }

    public List<SkillCertificateDTO> getCertificates() { return certificates; }
    public void setCertificates(List<SkillCertificateDTO> certificates) { this.certificates = certificates; }

    public List<SkillProjectDTO> getProjects() { return projects; }
    public void setProjects(List<SkillProjectDTO> projects) { this.projects = projects; }

    public long getTotalStudyMinutes() { return totalStudyMinutes; }
    public void setTotalStudyMinutes(long totalStudyMinutes) { this.totalStudyMinutes = totalStudyMinutes; }
}
