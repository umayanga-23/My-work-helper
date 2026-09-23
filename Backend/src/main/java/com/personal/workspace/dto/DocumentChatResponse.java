package com.personal.workspace.dto;

import java.util.List;

public class DocumentChatResponse {
    private String answer;
    private List<String> extractedKeyPoints;
    private List<AiActionItem> suggestedTasks;

    public DocumentChatResponse() {}

    public DocumentChatResponse(String answer, List<String> extractedKeyPoints, List<AiActionItem> suggestedTasks) {
        this.answer = answer;
        this.extractedKeyPoints = extractedKeyPoints;
        this.suggestedTasks = suggestedTasks;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<String> getExtractedKeyPoints() {
        return extractedKeyPoints;
    }

    public void setExtractedKeyPoints(List<String> extractedKeyPoints) {
        this.extractedKeyPoints = extractedKeyPoints;
    }

    public List<AiActionItem> getSuggestedTasks() {
        return suggestedTasks;
    }

    public void setSuggestedTasks(List<AiActionItem> suggestedTasks) {
        this.suggestedTasks = suggestedTasks;
    }
}
