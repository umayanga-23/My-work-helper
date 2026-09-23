package com.personal.workspace.dto;

import java.time.LocalDate;
import java.util.UUID;

public class PlanOrderItemDTO {
    private int orderNumber;
    private UUID taskId;
    private String taskKey;
    private String taskTitle;
    private String reason;
    private Integer estimatedDuration;
    private String priority;
    private String status;
    private String projectName;
    private LocalDate dueDate;
    private String dueTime;

    public PlanOrderItemDTO() {}

    public PlanOrderItemDTO(int orderNumber, UUID taskId, String taskKey, String taskTitle, String reason,
                            Integer estimatedDuration, String priority, String status, String projectName,
                            LocalDate dueDate, String dueTime) {
        this.orderNumber = orderNumber;
        this.taskId = taskId;
        this.taskKey = taskKey;
        this.taskTitle = taskTitle;
        this.reason = reason;
        this.estimatedDuration = estimatedDuration;
        this.priority = priority;
        this.status = status;
        this.projectName = projectName;
        this.dueDate = dueDate;
        this.dueTime = dueTime;
    }

    public int getOrderNumber() { return orderNumber; }
    public void setOrderNumber(int orderNumber) { this.orderNumber = orderNumber; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public String getTaskKey() { return taskKey; }
    public void setTaskKey(String taskKey) { this.taskKey = taskKey; }

    public String getTaskTitle() { return taskTitle; }
    public void setTaskTitle(String taskTitle) { this.taskTitle = taskTitle; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Integer getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(Integer estimatedDuration) { this.estimatedDuration = estimatedDuration; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getDueTime() { return dueTime; }
    public void setDueTime(String dueTime) { this.dueTime = dueTime; }
}
