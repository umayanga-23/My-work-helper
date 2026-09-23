package com.personal.workspace.dto;

import java.util.List;

public class MorningBriefingDTO {
    private String greeting;
    private String motivationQuote;
    private String summaryText;
    private int urgentTasksCount;
    private int pendingTasksCount;
    private int activeProjectsCount;
    private int currentStreakDays;
    private List<TaskDTO> topFocusTasks;
    private List<String> strategicInsights;

    public MorningBriefingDTO() {}

    public String getGreeting() { return greeting; }
    public void setGreeting(String greeting) { this.greeting = greeting; }

    public String getMotivationQuote() { return motivationQuote; }
    public void setMotivationQuote(String motivationQuote) { this.motivationQuote = motivationQuote; }

    public String getSummaryText() { return summaryText; }
    public void setSummaryText(String summaryText) { this.summaryText = summaryText; }

    public int getUrgentTasksCount() { return urgentTasksCount; }
    public void setUrgentTasksCount(int urgentTasksCount) { this.urgentTasksCount = urgentTasksCount; }

    public int getPendingTasksCount() { return pendingTasksCount; }
    public void setPendingTasksCount(int pendingTasksCount) { this.pendingTasksCount = pendingTasksCount; }

    public int getActiveProjectsCount() { return activeProjectsCount; }
    public void setActiveProjectsCount(int activeProjectsCount) { this.activeProjectsCount = activeProjectsCount; }

    public int getCurrentStreakDays() { return currentStreakDays; }
    public void setCurrentStreakDays(int currentStreakDays) { this.currentStreakDays = currentStreakDays; }

    public List<TaskDTO> getTopFocusTasks() { return topFocusTasks; }
    public void setTopFocusTasks(List<TaskDTO> topFocusTasks) { this.topFocusTasks = topFocusTasks; }

    public List<String> getStrategicInsights() { return strategicInsights; }
    public void setStrategicInsights(List<String> strategicInsights) { this.strategicInsights = strategicInsights; }
}
