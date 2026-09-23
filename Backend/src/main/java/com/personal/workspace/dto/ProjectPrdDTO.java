package com.personal.workspace.dto;

import java.util.List;
import java.util.UUID;

public class ProjectPrdDTO {
    private UUID projectId;
    private String projectName;
    private String executiveSummary;
    private String targetAudience;
    private List<String> keyFeatures;
    private List<String> recommendedTechStack;
    private List<String> potentialRisks;
    private List<SprintMilestoneDTO> sprintMilestones;

    public ProjectPrdDTO() {}

    public static class SprintMilestoneDTO {
        private String milestoneName; // e.g. "Sprint 1: Core Foundation & Auth"
        private String objective;
        private List<AiActionItem> tasks;

        public SprintMilestoneDTO() {}

        public SprintMilestoneDTO(String milestoneName, String objective, List<AiActionItem> tasks) {
            this.milestoneName = milestoneName;
            this.objective = objective;
            this.tasks = tasks;
        }

        public String getMilestoneName() {
            return milestoneName;
        }

        public void setMilestoneName(String milestoneName) {
            this.milestoneName = milestoneName;
        }

        public String getObjective() {
            return objective;
        }

        public void setObjective(String objective) {
            this.objective = objective;
        }

        public List<AiActionItem> getTasks() {
            return tasks;
        }

        public void setTasks(List<AiActionItem> tasks) {
            this.tasks = tasks;
        }
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getExecutiveSummary() {
        return executiveSummary;
    }

    public void setExecutiveSummary(String executiveSummary) {
        this.executiveSummary = executiveSummary;
    }

    public String getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(String targetAudience) {
        this.targetAudience = targetAudience;
    }

    public List<String> getKeyFeatures() {
        return keyFeatures;
    }

    public void setKeyFeatures(List<String> keyFeatures) {
        this.keyFeatures = keyFeatures;
    }

    public List<String> getRecommendedTechStack() {
        return recommendedTechStack;
    }

    public void setRecommendedTechStack(List<String> recommendedTechStack) {
        this.recommendedTechStack = recommendedTechStack;
    }

    public List<String> getPotentialRisks() {
        return potentialRisks;
    }

    public void setPotentialRisks(List<String> potentialRisks) {
        this.potentialRisks = potentialRisks;
    }

    public List<SprintMilestoneDTO> getSprintMilestones() {
        return sprintMilestones;
    }

    public void setSprintMilestones(List<SprintMilestoneDTO> sprintMilestones) {
        this.sprintMilestones = sprintMilestones;
    }
}
