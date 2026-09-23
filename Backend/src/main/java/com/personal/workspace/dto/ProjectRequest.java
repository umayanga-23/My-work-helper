package com.personal.workspace.dto;

import com.personal.workspace.entity.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;
    private ProjectStatus status = ProjectStatus.PLANNING;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer progress;
    private String projectKey;
    private String githubRepo;
    private String githubToken;

    public ProjectRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }

    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }

    public String getGithubRepo() { return githubRepo; }
    public void setGithubRepo(String githubRepo) { this.githubRepo = githubRepo; }

    public String getGithubToken() { return githubToken; }
    public void setGithubToken(String githubToken) { this.githubToken = githubToken; }
}
