package com.personal.workspace.dto;

import java.util.List;

public class StudyStatsDTO {
    private int currentStreakDays;
    private long totalStudyMinutes;
    private double totalStudyHours;
    private long todayStudyMinutes;
    private int totalMasteredTopics;
    private int totalSkillsCount;
    private List<StudySessionDTO> recentSessions;

    public StudyStatsDTO() {}

    public StudyStatsDTO(int currentStreakDays, long totalStudyMinutes, double totalStudyHours, long todayStudyMinutes, int totalMasteredTopics, int totalSkillsCount, List<StudySessionDTO> recentSessions) {
        this.currentStreakDays = currentStreakDays;
        this.totalStudyMinutes = totalStudyMinutes;
        this.totalStudyHours = totalStudyHours;
        this.todayStudyMinutes = todayStudyMinutes;
        this.totalMasteredTopics = totalMasteredTopics;
        this.totalSkillsCount = totalSkillsCount;
        this.recentSessions = recentSessions;
    }

    public int getCurrentStreakDays() { return currentStreakDays; }
    public void setCurrentStreakDays(int currentStreakDays) { this.currentStreakDays = currentStreakDays; }

    public long getTotalStudyMinutes() { return totalStudyMinutes; }
    public void setTotalStudyMinutes(long totalStudyMinutes) { this.totalStudyMinutes = totalStudyMinutes; }

    public double getTotalStudyHours() { return totalStudyHours; }
    public void setTotalStudyHours(double totalStudyHours) { this.totalStudyHours = totalStudyHours; }

    public long getTodayStudyMinutes() { return todayStudyMinutes; }
    public void setTodayStudyMinutes(long todayStudyMinutes) { this.todayStudyMinutes = todayStudyMinutes; }

    public int getTotalMasteredTopics() { return totalMasteredTopics; }
    public void setTotalMasteredTopics(int totalMasteredTopics) { this.totalMasteredTopics = totalMasteredTopics; }

    public int getTotalSkillsCount() { return totalSkillsCount; }
    public void setTotalSkillsCount(int totalSkillsCount) { this.totalSkillsCount = totalSkillsCount; }

    public List<StudySessionDTO> getRecentSessions() { return recentSessions; }
    public void setRecentSessions(List<StudySessionDTO> recentSessions) { this.recentSessions = recentSessions; }
}
