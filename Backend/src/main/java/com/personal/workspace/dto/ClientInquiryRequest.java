package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;

public class ClientInquiryRequest {

    @NotBlank(message = "Name is required")
    private String visitorName;

    @NotBlank(message = "Email or phone number is required")
    private String emailOrPhone;

    @NotBlank(message = "Requirement details are required")
    private String requirement;

    public ClientInquiryRequest() {}

    public ClientInquiryRequest(String visitorName, String emailOrPhone, String requirement) {
        this.visitorName = visitorName;
        this.emailOrPhone = emailOrPhone;
        this.requirement = requirement;
    }

    public String getVisitorName() {
        return visitorName;
    }

    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }

    public String getEmailOrPhone() {
        return emailOrPhone;
    }

    public void setEmailOrPhone(String emailOrPhone) {
        this.emailOrPhone = emailOrPhone;
    }

    public String getRequirement() {
        return requirement;
    }

    public void setRequirement(String requirement) {
        this.requirement = requirement;
    }
}
