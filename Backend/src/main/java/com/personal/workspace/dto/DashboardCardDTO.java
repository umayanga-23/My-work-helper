package com.personal.workspace.dto;

import com.personal.workspace.entity.CardType;
import java.time.ZonedDateTime;
import java.util.UUID;

public class DashboardCardDTO {
    private UUID id;
    private UUID userId;
    private String title;
    private String description;
    private String icon;
    private String color;
    private CardType type;
    private String config;
    private int position;
    private boolean isVisible;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public DashboardCardDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public CardType getType() { return type; }
    public void setType(CardType type) { this.type = type; }

    public String getConfig() { return config; }
    public void setConfig(String config) { this.config = config; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public boolean isVisible() { return isVisible; }
    public void setVisible(boolean visible) { isVisible = visible; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
