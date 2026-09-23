package com.personal.workspace.dto;

public class KnowledgeQueryRequest {
    private String query;

    public KnowledgeQueryRequest() {}

    public KnowledgeQueryRequest(String query) {
        this.query = query;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
}
