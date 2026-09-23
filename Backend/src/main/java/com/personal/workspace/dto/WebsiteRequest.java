package com.personal.workspace.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class WebsiteRequest {

    @NotBlank(message = "Website name is required")
    private String name;

    @NotBlank(message = "Website URL is required")
    private String url;

    private String faviconUrl;
    private String description;
    private String color = "#0c93e7";

    @JsonProperty("isFavorite")
    private boolean isFavorite = false;
    private String tags;
    private UUID categoryId;
    private UUID projectId;

    public WebsiteRequest() {}

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

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }
}
