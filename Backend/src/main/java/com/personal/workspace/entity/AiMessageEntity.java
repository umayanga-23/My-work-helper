package com.personal.workspace.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_messages")
public class AiMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AiConversationEntity conversation;

    @Column(nullable = false, length = 50)
    private String role; // "user" or "assistant" or "system"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "action_type", length = 50)
    private String actionType; // "CREATE_TASKS", "DECOMPOSE_TASK", "PLAN_TODAY", "CREATE_PROJECT", etc.

    @Column(name = "action_payload", columnDefinition = "TEXT")
    private String actionPayload; // JSON string

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
    }

    public AiMessageEntity() {}

    public AiMessageEntity(AiConversationEntity conversation, String role, String content, String actionType, String actionPayload) {
        this.conversation = conversation;
        this.role = role;
        this.content = content;
        this.actionType = actionType;
        this.actionPayload = actionPayload;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public AiConversationEntity getConversation() { return conversation; }
    public void setConversation(AiConversationEntity conversation) { this.conversation = conversation; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getActionPayload() { return actionPayload; }
    public void setActionPayload(String actionPayload) { this.actionPayload = actionPayload; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
