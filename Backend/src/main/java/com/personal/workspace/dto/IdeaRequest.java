package com.personal.workspace.dto;

import com.personal.workspace.entity.IdeaStatus;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class IdeaRequest {

    @NotBlank(message = "Idea title is required")
    private String title;

    private String description;
    private String category;
    private IdeaStatus status = IdeaStatus.IDEA;
    private List<String> tags;

    public IdeaRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public IdeaStatus getStatus() { return status; }
    public void setStatus(IdeaStatus status) { this.status = status; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
