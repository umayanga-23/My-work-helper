package com.personal.workspace.dto;

import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.UUID;

public class StudySessionRequest {

    private UUID skillId;
    private UUID topicId;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private int durationMinutes;

    private LocalDate sessionDate;
    private String notes;

    public StudySessionRequest() {}

    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID skillId) { this.skillId = skillId; }

    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
