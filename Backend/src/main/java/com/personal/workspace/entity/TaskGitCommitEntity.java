package com.personal.workspace.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "task_git_commits")
public class TaskGitCommitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "task_key", length = 30)
    private String taskKey;

    @Column(name = "commit_hash", length = 60, nullable = false)
    private String commitHash;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "commit_url", length = 500)
    private String commitUrl;

    @Column(name = "timestamp")
    private ZonedDateTime timestamp;

    @Column(name = "event_type", length = 50)
    private String eventType = "PUSH"; // PUSH, PULL_REQUEST, MERGE, MANUAL_SYNC

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
        if (this.timestamp == null) {
            this.timestamp = ZonedDateTime.now();
        }
    }

    public TaskGitCommitEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getTaskKey() { return taskKey; }
    public void setTaskKey(String taskKey) { this.taskKey = taskKey; }

    public String getCommitHash() { return commitHash; }
    public void setCommitHash(String commitHash) { this.commitHash = commitHash; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getCommitUrl() { return commitUrl; }
    public void setCommitUrl(String commitUrl) { this.commitUrl = commitUrl; }

    public ZonedDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(ZonedDateTime timestamp) { this.timestamp = timestamp; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
