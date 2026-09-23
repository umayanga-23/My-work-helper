package com.personal.workspace.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.ZonedDateTime;
import java.util.UUID;

public class WebsiteDTO {
    private UUID id;
    private UUID userId;
    private UUID categoryId;
    private UUID projectId;
    private String name;
    private String url;
    private String faviconUrl;
    private String description;
    private String color = "#0c93e7";

    @JsonProperty("isFavorite")
    private boolean isFavorite;
    private Integer visitCount;
    private String tags;
    private long linkedTaskCount;
    private ZonedDateTime lastVisitedAt;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private String categoryName;

    public WebsiteDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getFaviconUrl() { return faviconUrl; }
    public void setFaviconUrl(String faviconUrl) { this.faviconUrl = faviconUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    @JsonProperty("isFavorite")
    public boolean isFavorite() { return isFavorite; }
    @JsonProperty("isFavorite")
    public void setFavorite(boolean favorite) { isFavorite = favorite; }

    public Integer getVisitCount() { return visitCount != null ? visitCount : 0; }
    public void setVisitCount(Integer visitCount) { this.visitCount = visitCount; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public long getLinkedTaskCount() { return linkedTaskCount; }
    public void setLinkedTaskCount(long linkedTaskCount) { this.linkedTaskCount = linkedTaskCount; }

    public ZonedDateTime getLastVisitedAt() { return lastVisitedAt; }
    public void setLastVisitedAt(ZonedDateTime lastVisitedAt) { this.lastVisitedAt = lastVisitedAt; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
}
