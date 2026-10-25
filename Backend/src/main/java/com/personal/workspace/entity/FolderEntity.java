package com.personal.workspace.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "folders", indexes = {
    @Index(name = "idx_folders_user_type", columnList = "user_id, type"),
    @Index(name = "idx_folders_parent", columnList = "parent_id")
})
public class FolderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 50)
    private String type; // DOCUMENT, NOTE, DRIVE, GENERAL

    @Column(length = 50)
    private String color = "#10b981";

    @Column(length = 50)
    private String icon = "Folder";

    @Column(name = "position_idx")
    private Integer position = 0;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
        this.updatedAt = ZonedDateTime.now();
        if (this.color == null || this.color.isBlank()) this.color = "#10b981";
        if (this.icon == null || this.icon.isBlank()) this.icon = "Folder";
        if (this.position == null) this.position = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = ZonedDateTime.now();
    }

    public FolderEntity() {}

    public FolderEntity(UUID userId, UUID parentId, String name, String type, String color, String icon) {
        this.userId = userId;
        this.parentId = parentId;
        this.name = name;
        this.type = type != null ? type.toUpperCase() : "DOCUMENT";
        this.color = color != null ? color : "#10b981";
        this.icon = icon != null ? icon : "Folder";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
