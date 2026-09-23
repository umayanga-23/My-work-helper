package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class DocumentRequest {

    @NotBlank(message = "Document display name is required")
    private String name;

    @NotBlank(message = "Original file name is required")
    private String originalFileName;

    @NotBlank(message = "File path in storage is required")
    private String filePath;

    private String fileType;

    @NotNull(message = "File size is required")
    private Long fileSize;

    private UUID categoryId;
    private UUID projectId;
    private Boolean isFavorite;
    private String description;
    private String tags;

    public DocumentRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }

    public Boolean getIsFavorite() { return isFavorite; }
    public void setIsFavorite(Boolean isFavorite) { this.isFavorite = isFavorite; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
}
