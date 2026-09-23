package com.personal.workspace.dto;

import com.personal.workspace.entity.CardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DashboardCardRequest {

    @NotBlank(message = "Card title is required")
    private String title;

    private String description;
    private String icon;
    private String color = "#0c93e7";

    @NotNull(message = "Card type is required")
    private CardType type;

    private String config;
    private Integer position = 0;
    private Boolean isVisible = true;

    public DashboardCardRequest() {}

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

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public Boolean getIsVisible() { return isVisible; }
    public void setIsVisible(Boolean isVisible) { this.isVisible = isVisible; }
}
