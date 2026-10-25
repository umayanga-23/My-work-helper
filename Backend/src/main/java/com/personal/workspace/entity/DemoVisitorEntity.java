package com.personal.workspace.entity;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "demo_visitors")
public class DemoVisitorEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(length = 100)
    private String country;

    @Column(length = 100)
    private String city;

    @Column(name = "device_type", length = 50)
    private String deviceType;

    @Column(length = 100)
    private String browser;

    @Column(length = 100)
    private String os;

    @Column(name = "visited_at", nullable = false)
    private ZonedDateTime visitedAt;

    public DemoVisitorEntity() {}

    public DemoVisitorEntity(String name, String ipAddress, String country, String city, String deviceType, String browser, String os) {
        this.name = name;
        this.ipAddress = ipAddress;
        this.country = country;
        this.city = city;
        this.deviceType = deviceType;
        this.browser = browser;
        this.os = os;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (visitedAt == null) {
            visitedAt = ZonedDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
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

    public ZonedDateTime getVisitedAt() {
        return visitedAt;
    }

    public void setVisitedAt(ZonedDateTime visitedAt) {
        this.visitedAt = visitedAt;
    }
}
