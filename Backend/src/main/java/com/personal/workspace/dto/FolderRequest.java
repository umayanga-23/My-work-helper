package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class FolderRequest {

    @NotBlank(message = "Folder name is required")
    private String name;

    private UUID parentId;

    private String type = "DOCUMENT"; // DOCUMENT, NOTE, DRIVE, GENERAL

    private String color = "#10b981";

    private String icon = "Folder";

    public FolderRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
