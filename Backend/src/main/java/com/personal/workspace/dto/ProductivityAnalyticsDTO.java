package com.personal.workspace.dto;

import java.util.List;
import java.util.Map;

public class ProductivityAnalyticsDTO {
    private int totalFocusMinutesThisWeek;
    private int completedTasksThisWeek;
    private String peakProductivityTime;
    private int focusEfficiencyScore;
    private String flowStateDiagnosis;
    private List<String> actionableRecommendations;
    private Map<String, Integer> dailyFocusMinutes;

    public ProductivityAnalyticsDTO() {}

    public ProductivityAnalyticsDTO(int totalFocusMinutesThisWeek, int completedTasksThisWeek,
                                    String peakProductivityTime, int focusEfficiencyScore,
                                    String flowStateDiagnosis, List<String> actionableRecommendations,
                                    Map<String, Integer> dailyFocusMinutes) {
        this.totalFocusMinutesThisWeek = totalFocusMinutesThisWeek;
        this.completedTasksThisWeek = completedTasksThisWeek;
        this.peakProductivityTime = peakProductivityTime;
        this.focusEfficiencyScore = focusEfficiencyScore;
        this.flowStateDiagnosis = flowStateDiagnosis;
        this.actionableRecommendations = actionableRecommendations;
        this.dailyFocusMinutes = dailyFocusMinutes;
    }

    public int getTotalFocusMinutesThisWeek() {
        return totalFocusMinutesThisWeek;
    }

    public void setTotalFocusMinutesThisWeek(int totalFocusMinutesThisWeek) {
        this.totalFocusMinutesThisWeek = totalFocusMinutesThisWeek;
    }

    public int getCompletedTasksThisWeek() {
        return completedTasksThisWeek;
    }

    public void setCompletedTasksThisWeek(int completedTasksThisWeek) {
        this.completedTasksThisWeek = completedTasksThisWeek;
    }

    public String getPeakProductivityTime() {
        return peakProductivityTime;
    }

    public void setPeakProductivityTime(String peakProductivityTime) {
        this.peakProductivityTime = peakProductivityTime;
    }

    public int getFocusEfficiencyScore() {
        return focusEfficiencyScore;
    }

    public void setFocusEfficiencyScore(int focusEfficiencyScore) {
        this.focusEfficiencyScore = focusEfficiencyScore;
    }

    public String getFlowStateDiagnosis() {
        return flowStateDiagnosis;
    }

    public void setFlowStateDiagnosis(String flowStateDiagnosis) {
        this.flowStateDiagnosis = flowStateDiagnosis;
    }

    public List<String> getActionableRecommendations() {
        return actionableRecommendations;
    }

    public void setActionableRecommendations(List<String> actionableRecommendations) {
        this.actionableRecommendations = actionableRecommendations;
    }

    public Map<String, Integer> getDailyFocusMinutes() {
        return dailyFocusMinutes;
    }

    public void setDailyFocusMinutes(Map<String, Integer> dailyFocusMinutes) {
        this.dailyFocusMinutes = dailyFocusMinutes;
    }
}
