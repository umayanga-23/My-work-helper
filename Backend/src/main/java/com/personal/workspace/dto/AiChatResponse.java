package com.personal.workspace.dto;

import java.util.List;
import java.util.UUID;

public class AiChatResponse {
    private String reply;
    private UUID conversationId;
    private String actionType; // "CREATE_TASKS", "DECOMPOSE_TASK", "PLAN_TODAY", etc.
    private List<AiActionItem> proposedActions;

    public AiChatResponse() {}

    public AiChatResponse(String reply, UUID conversationId, String actionType, List<AiActionItem> proposedActions) {
        this.reply = reply;
        this.conversationId = conversationId;
        this.actionType = actionType;
        this.proposedActions = proposedActions;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID conversationId) { this.conversationId = conversationId; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public List<AiActionItem> getProposedActions() { return proposedActions; }
    public void setProposedActions(List<AiActionItem> proposedActions) { this.proposedActions = proposedActions; }
}
