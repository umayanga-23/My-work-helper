package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;

public class CredentialRequest {
    private String category;

    @NotBlank(message = "Service name is required")
    private String serviceName;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Encrypted password payload is required")
    private String encryptedPassword;

    private String iv;
    private String salt;
    private String url;
    private String notes;

    public CredentialRequest() {}

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEncryptedPassword() { return encryptedPassword; }
    public void setEncryptedPassword(String encryptedPassword) { this.encryptedPassword = encryptedPassword; }

    public String getIv() { return iv; }
    public void setIv(String iv) { this.iv = iv; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
