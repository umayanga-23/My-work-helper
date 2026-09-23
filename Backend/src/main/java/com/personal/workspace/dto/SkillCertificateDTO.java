package com.personal.workspace.dto;

import java.time.ZonedDateTime;
import java.util.UUID;

public class SkillCertificateDTO {
    private UUID id;
    private UUID userId;
    private UUID skillId;
    private String title;
    private String issuer;
    private String issueDate;
    private String credentialUrl;
    private String certificateUrl;
    private ZonedDateTime createdAt;

    public SkillCertificateDTO() {}

    public SkillCertificateDTO(UUID id, UUID userId, UUID skillId, String title, String issuer, String issueDate, String credentialUrl, String certificateUrl, ZonedDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.skillId = skillId;
        this.title = title;
        this.issuer = issuer;
        this.issueDate = issueDate;
        this.credentialUrl = credentialUrl;
        this.certificateUrl = certificateUrl;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID skillId) { this.skillId = skillId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }

    public String getIssueDate() { return issueDate; }
    public void setIssueDate(String issueDate) { this.issueDate = issueDate; }

    public String getCredentialUrl() { return credentialUrl; }
    public void setCredentialUrl(String credentialUrl) { this.credentialUrl = credentialUrl; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
