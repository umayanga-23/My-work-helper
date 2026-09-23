package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;

public class SkillRequest {

    @NotBlank(message = "Skill name is required")
    private String name;

    private String category;
    private Integer proficiencyPercent = 0;
    private String targetLevel;
    private String notes;

    public SkillRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getProficiencyPercent() { return proficiencyPercent; }
    public void setProficiencyPercent(Integer proficiencyPercent) { this.proficiencyPercent = proficiencyPercent; }

    public String getTargetLevel() { return targetLevel; }
    public void setTargetLevel(String targetLevel) { this.targetLevel = targetLevel; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
