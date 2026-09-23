package com.personal.workspace.dto;

import java.util.List;

public class ProjectWorkspaceDTO {
    private ProjectDTO project;
    private List<TaskDTO> tasks;
    private List<NoteDTO> notes;
    private List<DocumentDTO> documents;
    private List<WebsiteDTO> websites;
    private List<DriveLinkDTO> driveLinks;
    private List<TaskGitCommitDTO> gitCommits;
    private List<ProjectMilestoneDTO> milestones;
    private List<ProjectIssueDTO> issues;
    private List<ActivityLogDTO> activity;

    public ProjectWorkspaceDTO() {}

    public ProjectWorkspaceDTO(ProjectDTO project, List<TaskDTO> tasks, List<NoteDTO> notes, List<DocumentDTO> documents, List<WebsiteDTO> websites, List<DriveLinkDTO> driveLinks) {
        this.project = project;
        this.tasks = tasks;
        this.notes = notes;
        this.documents = documents;
        this.websites = websites;
        this.driveLinks = driveLinks;
    }

    public ProjectWorkspaceDTO(ProjectDTO project, List<TaskDTO> tasks, List<NoteDTO> notes, List<DocumentDTO> documents,
                               List<WebsiteDTO> websites, List<DriveLinkDTO> driveLinks,
                               List<TaskGitCommitDTO> gitCommits, List<ProjectMilestoneDTO> milestones,
                               List<ProjectIssueDTO> issues, List<ActivityLogDTO> activity) {
        this.project = project;
        this.tasks = tasks;
        this.notes = notes;
        this.documents = documents;
        this.websites = websites;
        this.driveLinks = driveLinks;
        this.gitCommits = gitCommits;
        this.milestones = milestones;
        this.issues = issues;
        this.activity = activity;
    }

    public ProjectDTO getProject() { return project; }
    public void setProject(ProjectDTO project) { this.project = project; }

    public List<TaskDTO> getTasks() { return tasks; }
    public void setTasks(List<TaskDTO> tasks) { this.tasks = tasks; }

    public List<NoteDTO> getNotes() { return notes; }
    public void setNotes(List<NoteDTO> notes) { this.notes = notes; }

    public List<DocumentDTO> getDocuments() { return documents; }
    public void setDocuments(List<DocumentDTO> documents) { this.documents = documents; }

    public List<WebsiteDTO> getWebsites() { return websites; }
    public void setWebsites(List<WebsiteDTO> websites) { this.websites = websites; }

    public List<DriveLinkDTO> getDriveLinks() { return driveLinks; }
    public void setDriveLinks(List<DriveLinkDTO> driveLinks) { this.driveLinks = driveLinks; }

    public List<TaskGitCommitDTO> getGitCommits() { return gitCommits; }
    public void setGitCommits(List<TaskGitCommitDTO> gitCommits) { this.gitCommits = gitCommits; }

    public List<ProjectMilestoneDTO> getMilestones() { return milestones; }
    public void setMilestones(List<ProjectMilestoneDTO> milestones) { this.milestones = milestones; }

    public List<ProjectIssueDTO> getIssues() { return issues; }
    public void setIssues(List<ProjectIssueDTO> issues) { this.issues = issues; }

    public List<ActivityLogDTO> getActivity() { return activity; }
    public void setActivity(List<ActivityLogDTO> activity) { this.activity = activity; }
}
