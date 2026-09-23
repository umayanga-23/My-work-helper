package com.personal.workspace.dto;

import java.util.List;
import java.util.UUID;

public class DecomposeResultDTO {
    private UUID parentTaskId;
    private String parentTaskTitle;
    private String strategyOverview;
    private List<AiActionItem> generatedSubtasks;

    public DecomposeResultDTO() {}

    public DecomposeResultDTO(UUID parentTaskId, String parentTaskTitle, String strategyOverview, List<AiActionItem> generatedSubtasks) {
        this.parentTaskId = parentTaskId;
        this.parentTaskTitle = parentTaskTitle;
        this.strategyOverview = strategyOverview;
        this.generatedSubtasks = generatedSubtasks;
    }

    public UUID getParentTaskId() { return parentTaskId; }
    public void setParentTaskId(UUID parentTaskId) { this.parentTaskId = parentTaskId; }

    public String getParentTaskTitle() { return parentTaskTitle; }
    public void setParentTaskTitle(String parentTaskTitle) { this.parentTaskTitle = parentTaskTitle; }

    public String getStrategyOverview() { return strategyOverview; }
    public void setStrategyOverview(String strategyOverview) { this.strategyOverview = strategyOverview; }

    public List<AiActionItem> getGeneratedSubtasks() { return generatedSubtasks; }
    public void setGeneratedSubtasks(List<AiActionItem> generatedSubtasks) { this.generatedSubtasks = generatedSubtasks; }
}
