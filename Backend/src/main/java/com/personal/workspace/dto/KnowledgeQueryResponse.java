package com.personal.workspace.dto;

import java.util.List;

public class KnowledgeQueryResponse {
    private String answer;
    private List<String> matchedSources;
    private List<AiActionItem> suggestedActions;

    public KnowledgeQueryResponse() {}

    public KnowledgeQueryResponse(String answer, List<String> matchedSources, List<AiActionItem> suggestedActions) {
        this.answer = answer;
        this.matchedSources = matchedSources;
        this.suggestedActions = suggestedActions;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<String> getMatchedSources() {
        return matchedSources;
    }

    public void setMatchedSources(List<String> matchedSources) {
        this.matchedSources = matchedSources;
    }

    public List<AiActionItem> getSuggestedActions() {
        return suggestedActions;
    }

    public void setSuggestedActions(List<AiActionItem> suggestedActions) {
        this.suggestedActions = suggestedActions;
    }
}
