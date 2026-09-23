package com.personal.workspace.dto;

import java.util.Map;

public class SystemMetricsDTO {
    private String status;
    private long uptimeSeconds;
    private String javaVersion;
    private String osName;
    private long totalMemoryMb;
    private long freeMemoryMb;
    private long maxMemoryMb;
    private String supabaseStorageStatus;
    private SupabaseStorageMetricsDTO supabaseStorageMetrics;
    private Map<String, Long> databaseTableCounts;

    public SystemMetricsDTO() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getUptimeSeconds() { return uptimeSeconds; }
    public void setUptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }

    public String getJavaVersion() { return javaVersion; }
    public void setJavaVersion(String javaVersion) { this.javaVersion = javaVersion; }

    public String getOsName() { return osName; }
    public void setOsName(String osName) { this.osName = osName; }

    public long getTotalMemoryMb() { return totalMemoryMb; }
    public void setTotalMemoryMb(long totalMemoryMb) { this.totalMemoryMb = totalMemoryMb; }

    public long getFreeMemoryMb() { return freeMemoryMb; }
    public void setFreeMemoryMb(long freeMemoryMb) { this.freeMemoryMb = freeMemoryMb; }

    public long getMaxMemoryMb() { return maxMemoryMb; }
    public void setMaxMemoryMb(long maxMemoryMb) { this.maxMemoryMb = maxMemoryMb; }

    public String getSupabaseStorageStatus() { return supabaseStorageStatus; }
    public void setSupabaseStorageStatus(String supabaseStorageStatus) { this.supabaseStorageStatus = supabaseStorageStatus; }

    public SupabaseStorageMetricsDTO getSupabaseStorageMetrics() { return supabaseStorageMetrics; }
    public void setSupabaseStorageMetrics(SupabaseStorageMetricsDTO supabaseStorageMetrics) { this.supabaseStorageMetrics = supabaseStorageMetrics; }

    public Map<String, Long> getDatabaseTableCounts() { return databaseTableCounts; }
    public void setDatabaseTableCounts(Map<String, Long> databaseTableCounts) { this.databaseTableCounts = databaseTableCounts; }
}
