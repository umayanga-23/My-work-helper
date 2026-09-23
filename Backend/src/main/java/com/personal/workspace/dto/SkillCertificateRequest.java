package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;

public class SkillCertificateRequest {

    @NotBlank(message = "Certificate title is required")
    private String title;

    private String issuer;
    private String issueDate;
    private String credentialUrl;
    private String certificateUrl;

    public SkillCertificateRequest() {}

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
}
