package com.personal.workspace.dto;

import java.util.UUID;

public class SearchResultDTO {
    private UUID id;
    private String title;
    private String description;
    private String type; // TASK, WEBSITE, NOTE, DOCUMENT, DRIVE_LINK, PROJECT, LEARNING, IDEA
    private String url;

    public SearchResultDTO() {}

    public SearchResultDTO(UUID id, String title, String description, String type, String url) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.url = url;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
