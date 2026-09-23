package com.personal.workspace.dto;

public class TaskSummaryDTO {
    private long totalTasks;
    private long completedTasks;
    private long remainingTasks;
    private long overdueTasks;
    private long inProgressTasks;
    private double completionPercentage;

    private long todayTotalTasks;
    private long todayCompletedTasks;
    private double todayPercentage;

    private long weeklyTotalTasks;
    private long weeklyCompletedTasks;
    private double weeklyPercentage;

    private long estimatedWorkloadMinutes;
    private String estimatedWorkloadFormatted;
    private long archivedTasks;

    public TaskSummaryDTO() {}

    public TaskSummaryDTO(long totalTasks, long completedTasks, long remainingTasks,
                          long overdueTasks, long inProgressTasks, double completionPercentage,
                          long todayTotalTasks, long todayCompletedTasks, double todayPercentage,
                          long weeklyTotalTasks, long weeklyCompletedTasks, double weeklyPercentage,
                          long estimatedWorkloadMinutes, String estimatedWorkloadFormatted,
                          long archivedTasks) {
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.remainingTasks = remainingTasks;
        this.overdueTasks = overdueTasks;
        this.inProgressTasks = inProgressTasks;
        this.completionPercentage = completionPercentage;
        this.todayTotalTasks = todayTotalTasks;
        this.todayCompletedTasks = todayCompletedTasks;
        this.todayPercentage = todayPercentage;
        this.weeklyTotalTasks = weeklyTotalTasks;
        this.weeklyCompletedTasks = weeklyCompletedTasks;
        this.weeklyPercentage = weeklyPercentage;
        this.estimatedWorkloadMinutes = estimatedWorkloadMinutes;
        this.estimatedWorkloadFormatted = estimatedWorkloadFormatted;
        this.archivedTasks = archivedTasks;
    }

    // Backward compatibility constructor for existing calls
    public TaskSummaryDTO(long totalTasks, long completedTasks, long pendingTasks, double completionPercentage, long todayTotalTasks, long todayCompletedTasks) {
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.remainingTasks = pendingTasks;
        this.completionPercentage = completionPercentage;
        this.todayTotalTasks = todayTotalTasks;
        this.todayCompletedTasks = todayCompletedTasks;
        this.todayPercentage = todayTotalTasks > 0 ? ((double) todayCompletedTasks / todayTotalTasks) * 100.0 : 0.0;
    }

    // Getters and Setters
    public long getTotalTasks() { return totalTasks; }
    public void setTotalTasks(long totalTasks) { this.totalTasks = totalTasks; }

    public long getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(long completedTasks) { this.completedTasks = completedTasks; }

    public long getRemainingTasks() { return remainingTasks; }
    public void setRemainingTasks(long remainingTasks) { this.remainingTasks = remainingTasks; }

    // Legacy getter alias
    public long getPendingTasks() { return remainingTasks; }
    public void setPendingTasks(long pendingTasks) { this.remainingTasks = pendingTasks; }

    public long getOverdueTasks() { return overdueTasks; }
    public void setOverdueTasks(long overdueTasks) { this.overdueTasks = overdueTasks; }

    public long getInProgressTasks() { return inProgressTasks; }
    public void setInProgressTasks(long inProgressTasks) { this.inProgressTasks = inProgressTasks; }

    public double getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(double completionPercentage) { this.completionPercentage = completionPercentage; }

    public long getTodayTotalTasks() { return todayTotalTasks; }
    public void setTodayTotalTasks(long todayTotalTasks) { this.todayTotalTasks = todayTotalTasks; }

    public long getTodayCompletedTasks() { return todayCompletedTasks; }
    public void setTodayCompletedTasks(long todayCompletedTasks) { this.todayCompletedTasks = todayCompletedTasks; }

    public double getTodayPercentage() { return todayPercentage; }
    public void setTodayPercentage(double todayPercentage) { this.todayPercentage = todayPercentage; }

    public long getWeeklyTotalTasks() { return weeklyTotalTasks; }
    public void setWeeklyTotalTasks(long weeklyTotalTasks) { this.weeklyTotalTasks = weeklyTotalTasks; }

    public long getWeeklyCompletedTasks() { return weeklyCompletedTasks; }
    public void setWeeklyCompletedTasks(long weeklyCompletedTasks) { this.weeklyCompletedTasks = weeklyCompletedTasks; }

    public double getWeeklyPercentage() { return weeklyPercentage; }
    public void setWeeklyPercentage(double weeklyPercentage) { this.weeklyPercentage = weeklyPercentage; }

    public long getEstimatedWorkloadMinutes() { return estimatedWorkloadMinutes; }
    public void setEstimatedWorkloadMinutes(long estimatedWorkloadMinutes) { this.estimatedWorkloadMinutes = estimatedWorkloadMinutes; }

    public String getEstimatedWorkloadFormatted() { return estimatedWorkloadFormatted; }
    public void setEstimatedWorkloadFormatted(String estimatedWorkloadFormatted) { this.estimatedWorkloadFormatted = estimatedWorkloadFormatted; }

    public long getArchivedTasks() { return archivedTasks; }
    public void setArchivedTasks(long archivedTasks) { this.archivedTasks = archivedTasks; }
}
