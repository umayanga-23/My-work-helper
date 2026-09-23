package com.personal.workspace.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsSummaryDTO {
    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private long overdueTasks;
    private double completionRate;

    private long totalNotes;
    private long totalWebsites;
    private long totalDocuments;
    private long totalDriveLinks;
    private long totalProjects;
    private long totalSkills;
    private long totalIdeas;

    private Map<String, Long> tasksByCategory;
    private Map<String, Long> tasksByPriority;
    private List<DailyActivityDTO> weeklyTrends;

    public AnalyticsSummaryDTO() {}

    public static class DailyActivityDTO {
        private String date;
        private String dayOfWeek;
        private long completedCount;
        private long createdCount;

        public DailyActivityDTO() {}

        public DailyActivityDTO(String date, String dayOfWeek, long completedCount, long createdCount) {
            this.date = date;
            this.dayOfWeek = dayOfWeek;
            this.completedCount = completedCount;
            this.createdCount = createdCount;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

        public long getCompletedCount() { return completedCount; }
        public void setCompletedCount(long completedCount) { this.completedCount = completedCount; }

        public long getCreatedCount() { return createdCount; }
        public void setCreatedCount(long createdCount) { this.createdCount = createdCount; }
    }

    // Getters and Setters
    public long getTotalTasks() { return totalTasks; }
    public void setTotalTasks(long totalTasks) { this.totalTasks = totalTasks; }

    public long getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(long completedTasks) { this.completedTasks = completedTasks; }

    public long getPendingTasks() { return pendingTasks; }
    public void setPendingTasks(long pendingTasks) { this.pendingTasks = pendingTasks; }

    public long getOverdueTasks() { return overdueTasks; }
    public void setOverdueTasks(long overdueTasks) { this.overdueTasks = overdueTasks; }

    public double getCompletionRate() { return completionRate; }
    public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }

    public long getTotalNotes() { return totalNotes; }
    public void setTotalNotes(long totalNotes) { this.totalNotes = totalNotes; }

    public long getTotalWebsites() { return totalWebsites; }
    public void setTotalWebsites(long totalWebsites) { this.totalWebsites = totalWebsites; }

    public long getTotalDocuments() { return totalDocuments; }
    public void setTotalDocuments(long totalDocuments) { this.totalDocuments = totalDocuments; }

    public long getTotalDriveLinks() { return totalDriveLinks; }
    public void setTotalDriveLinks(long totalDriveLinks) { this.totalDriveLinks = totalDriveLinks; }

    public long getTotalProjects() { return totalProjects; }
    public void setTotalProjects(long totalProjects) { this.totalProjects = totalProjects; }

    public long getTotalSkills() { return totalSkills; }
    public void setTotalSkills(long totalSkills) { this.totalSkills = totalSkills; }

    public long getTotalIdeas() { return totalIdeas; }
    public void setTotalIdeas(long totalIdeas) { this.totalIdeas = totalIdeas; }

    public Map<String, Long> getTasksByCategory() { return tasksByCategory; }
    public void setTasksByCategory(Map<String, Long> tasksByCategory) { this.tasksByCategory = tasksByCategory; }

    public Map<String, Long> getTasksByPriority() { return tasksByPriority; }
    public void setTasksByPriority(Map<String, Long> tasksByPriority) { this.tasksByPriority = tasksByPriority; }

    public List<DailyActivityDTO> getWeeklyTrends() { return weeklyTrends; }
    public void setWeeklyTrends(List<DailyActivityDTO> weeklyTrends) { this.weeklyTrends = weeklyTrends; }
}
