package com.personal.workspace.dto;

import java.util.ArrayList;
import java.util.List;

public class TodayPlanDTO {
    private String strategyRationale;
    private int estimatedTotalHours;
    private String estimatedWorkload;
    private String reasonForOrder;
    private List<String> potentialConflicts = new ArrayList<>();
    private List<PlanOrderItemDTO> suggestedOrder = new ArrayList<>();
    private List<TaskDTO> recommendedTasks = new ArrayList<>();

    public TodayPlanDTO() {}

    public TodayPlanDTO(String strategyRationale, int estimatedTotalHours, List<TaskDTO> recommendedTasks) {
        this.strategyRationale = strategyRationale;
        this.estimatedTotalHours = estimatedTotalHours;
        this.recommendedTasks = recommendedTasks;
    }

    public String getStrategyRationale() { return strategyRationale; }
    public void setStrategyRationale(String strategyRationale) { this.strategyRationale = strategyRationale; }

    public int getEstimatedTotalHours() { return estimatedTotalHours; }
    public void setEstimatedTotalHours(int estimatedTotalHours) { this.estimatedTotalHours = estimatedTotalHours; }

    public String getEstimatedWorkload() { return estimatedWorkload; }
    public void setEstimatedWorkload(String estimatedWorkload) { this.estimatedWorkload = estimatedWorkload; }

    public String getReasonForOrder() { return reasonForOrder; }
    public void setReasonForOrder(String reasonForOrder) { this.reasonForOrder = reasonForOrder; }

    public List<String> getPotentialConflicts() { return potentialConflicts; }
    public void setPotentialConflicts(List<String> potentialConflicts) { this.potentialConflicts = potentialConflicts; }

    public List<PlanOrderItemDTO> getSuggestedOrder() { return suggestedOrder; }
    public void setSuggestedOrder(List<PlanOrderItemDTO> suggestedOrder) { this.suggestedOrder = suggestedOrder; }

    public List<TaskDTO> getRecommendedTasks() { return recommendedTasks; }
    public void setRecommendedTasks(List<TaskDTO> recommendedTasks) { this.recommendedTasks = recommendedTasks; }
}
