package com.personal.workspace.dto;

import java.util.List;
import java.util.UUID;

public class IdeaExpansionDTO {
    private UUID ideaId;
    private String ideaTitle;
    private String valueProposition;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> opportunities;
    private List<String> threats;
    private List<String> recommendedTechStack;
    private List<AiActionItem> initialSprintTasks;

    public IdeaExpansionDTO() {}

    public UUID getIdeaId() {
        return ideaId;
    }

    public void setIdeaId(UUID ideaId) {
        this.ideaId = ideaId;
    }

    public String getIdeaTitle() {
        return ideaTitle;
    }

    public void setIdeaTitle(String ideaTitle) {
        this.ideaTitle = ideaTitle;
    }

    public String getValueProposition() {
        return valueProposition;
    }

    public void setValueProposition(String valueProposition) {
        this.valueProposition = valueProposition;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<String> getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(List<String> weaknesses) {
        this.weaknesses = weaknesses;
    }

    public List<String> getOpportunities() {
        return opportunities;
    }

    public void setOpportunities(List<String> opportunities) {
        this.opportunities = opportunities;
    }

    public List<String> getThreats() {
        return threats;
    }

    public void setThreats(List<String> threats) {
        this.threats = threats;
    }

    public List<String> getRecommendedTechStack() {
        return recommendedTechStack;
    }

    public void setRecommendedTechStack(List<String> recommendedTechStack) {
        this.recommendedTechStack = recommendedTechStack;
    }

    public List<AiActionItem> getInitialSprintTasks() {
        return initialSprintTasks;
    }

    public void setInitialSprintTasks(List<AiActionItem> initialSprintTasks) {
        this.initialSprintTasks = initialSprintTasks;
    }
}
