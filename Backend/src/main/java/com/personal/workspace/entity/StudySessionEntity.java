package com.personal.workspace.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "study_sessions")
public class StudySessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private SkillEntity skill;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private LearningTopicEntity topic;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
        if (this.sessionDate == null) {
            this.sessionDate = LocalDate.now();
        }
    }

    public StudySessionEntity() {}

    public StudySessionEntity(UUID userId, SkillEntity skill, LearningTopicEntity topic, int durationMinutes, LocalDate sessionDate, String notes) {
        this.userId = userId;
        this.skill = skill;
        this.topic = topic;
        this.durationMinutes = durationMinutes;
        this.sessionDate = sessionDate != null ? sessionDate : LocalDate.now();
        this.notes = notes;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public SkillEntity getSkill() { return skill; }
    public void setSkill(SkillEntity skill) { this.skill = skill; }

    public LearningTopicEntity getTopic() { return topic; }
    public void setTopic(LearningTopicEntity topic) { this.topic = topic; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
