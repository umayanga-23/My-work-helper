package com.personal.workspace.dto;

import jakarta.validation.constraints.NotBlank;

public class DemoVisitorRequest {

    @NotBlank(message = "Name is required to access demo")
    private String name;

    private String deviceType;
    private String browser;
    private String os;

    public DemoVisitorRequest() {}

    public DemoVisitorRequest(String name, String deviceType, String browser, String os) {
        this.name = name;
        this.deviceType = deviceType;
        this.browser = browser;
        this.os = os;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public String getBrowser() {
        return browser;
    }

    public void setBrowser(String browser) {
        this.browser = browser;
    }

    public String getOs() {
        return os;
    }

    public void setOs(String os) {
        this.os = os;
    }
}
