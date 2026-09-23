package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class LearningResourceRequest {

    @NotBlank(message = "Resource title is required")
    private String title;

    @NotBlank(message = "Resource URL is required")
    private String url;

    private String resourceType = "WEB_RESOURCE";
    private UUID topicId;

    public LearningResourceRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public UUID getTopicId() { return topicId; }
    public void setTopicId(UUID topicId) { this.topicId = topicId; }
}
