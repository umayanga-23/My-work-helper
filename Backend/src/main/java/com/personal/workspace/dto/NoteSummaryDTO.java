package com.personal.workspace.dto;

import java.util.List;
import java.util.UUID;

public class NoteSummaryDTO {
    private UUID noteId;
    private String noteTitle;
    private String executiveSummary;
    private List<String> keyTakeaways;
    private List<String> actionItems;
    private List<String> generatedTags;

    public NoteSummaryDTO() {}

    public NoteSummaryDTO(UUID noteId, String noteTitle, String executiveSummary,
                          List<String> keyTakeaways, List<String> actionItems, List<String> generatedTags) {
        this.noteId = noteId;
        this.noteTitle = noteTitle;
        this.executiveSummary = executiveSummary;
        this.keyTakeaways = keyTakeaways;
        this.actionItems = actionItems;
        this.generatedTags = generatedTags;
    }

    public UUID getNoteId() {
        return noteId;
    }

    public void setNoteId(UUID noteId) {
        this.noteId = noteId;
    }

    public String getNoteTitle() {
        return noteTitle;
    }

    public void setNoteTitle(String noteTitle) {
        this.noteTitle = noteTitle;
    }

    public String getExecutiveSummary() {
        return executiveSummary;
    }

    public void setExecutiveSummary(String executiveSummary) {
        this.executiveSummary = executiveSummary;
    }

    public List<String> getKeyTakeaways() {
        return keyTakeaways;
    }

    public void setKeyTakeaways(List<String> keyTakeaways) {
        this.keyTakeaways = keyTakeaways;
    }

    public List<String> getActionItems() {
        return actionItems;
    }

    public void setActionItems(List<String> actionItems) {
        this.actionItems = actionItems;
    }

    public List<String> getGeneratedTags() {
        return generatedTags;
    }

    public void setGeneratedTags(List<String> generatedTags) {
        this.generatedTags = generatedTags;
    }
}
