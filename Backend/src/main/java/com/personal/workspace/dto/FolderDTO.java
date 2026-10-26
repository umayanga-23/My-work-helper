package com.personal.workspace.dto;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class FolderDTO {

    private UUID id;
    private UUID userId;
    private UUID parentId;
    private String name;
    private String type;
    private String color;
    private String icon = "Folder";
    private UUID categoryId;
    private String categoryName;
    private String categoryColor;
    private Integer position;
    private long itemCount;
    private long subFolderCount;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private List<FolderDTO> children = new ArrayList<>();

    public FolderDTO() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getCategoryColor() { return categoryColor; }
    public void setCategoryColor(String categoryColor) { this.categoryColor = categoryColor; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public long getItemCount() { return itemCount; }
    public void setItemCount(long itemCount) { this.itemCount = itemCount; }

    public long getSubFolderCount() { return subFolderCount; }
    public void setSubFolderCount(long subFolderCount) { this.subFolderCount = subFolderCount; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<FolderDTO> getChildren() { return children; }
    public void setChildren(List<FolderDTO> children) { this.children = children; }
}
