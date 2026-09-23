package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class DriveLinkRequest {

    @NotBlank(message = "Resource link title is required")
    private String name;

    @NotBlank(message = "Resource URL is required")
    private String url;

    private String resourceType;
    private String description;
    private String tags;
    private boolean isFavorite = false;
    private UUID categoryId;
    private UUID projectId;

    public DriveLinkRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public boolean isFavorite() { return isFavorite; }
    public void setFavorite(boolean favorite) { isFavorite = favorite; }
    public boolean getIsFavorite() { return isFavorite; }
    public void setIsFavorite(boolean favorite) { isFavorite = favorite; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }
}
