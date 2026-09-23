package com.personal.workspace.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Join entity representing a task dependency relationship.
 * A record (taskId, dependsOnTaskId) means:
 *   Task[taskId] is BLOCKED BY Task[dependsOnTaskId]
 *   Task[dependsOnTaskId] BLOCKS Task[taskId]
 */
@Entity
@Table(
    name = "task_dependencies",
    uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "depends_on_task_id"})
)
public class TaskDependencyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "depends_on_task_id", nullable = false)
    private UUID dependsOnTaskId;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
    }

    public TaskDependencyEntity() {}

    public TaskDependencyEntity(UUID taskId, UUID dependsOnTaskId) {
        this.taskId = taskId;
        this.dependsOnTaskId = dependsOnTaskId;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public UUID getDependsOnTaskId() { return dependsOnTaskId; }
    public void setDependsOnTaskId(UUID dependsOnTaskId) { this.dependsOnTaskId = dependsOnTaskId; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
