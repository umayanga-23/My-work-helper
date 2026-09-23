package com.personal.workspace.dto;

import java.util.List;
import java.util.UUID;

public class AiChatRequest {
    private String message;
    private UUID conversationId;
    private List<ChatMessageItem> history;
    private String pageContext; // e.g. "TASKS_PAGE", "PROJECTS_PAGE", "HOME_DASHBOARD"

    public AiChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID conversationId) { this.conversationId = conversationId; }

    public List<ChatMessageItem> getHistory() { return history; }
    public void setHistory(List<ChatMessageItem> history) { this.history = history; }

    public String getPageContext() { return pageContext; }
    public void setPageContext(String pageContext) { this.pageContext = pageContext; }

    public static class ChatMessageItem {
        private String role;
        private String content;

        public ChatMessageItem() {}
        public ChatMessageItem(String role, String content) {
            this.role = role;
            this.content = content;
        }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
