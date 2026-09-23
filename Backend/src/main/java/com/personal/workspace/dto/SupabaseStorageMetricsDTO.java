package com.personal.workspace.dto;

public class SupabaseStorageMetricsDTO {
    private String bucketName;
    private String status;
    private long usedBytes;
    private long totalQuotaBytes;
    private String usedFormatted;
    private String freeFormatted;
    private String totalQuotaFormatted;
    private double usedPercentage;
    private long totalFiles;
    
    private long pdfCount;
    private long pdfBytes;
    private long imageCount;
    private long imageBytes;
    private long officeCount;
    private long officeBytes;
    private long otherCount;
    private long otherBytes;

    private String largestFileName;
    private String largestFileSizeFormatted;

    public SupabaseStorageMetricsDTO() {}

    public String getBucketName() { return bucketName; }
    public void setBucketName(String bucketName) { this.bucketName = bucketName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getUsedBytes() { return usedBytes; }
    public void setUsedBytes(long usedBytes) { this.usedBytes = usedBytes; }

    public long getTotalQuotaBytes() { return totalQuotaBytes; }
    public void setTotalQuotaBytes(long totalQuotaBytes) { this.totalQuotaBytes = totalQuotaBytes; }

    public String getUsedFormatted() { return usedFormatted; }
    public void setUsedFormatted(String usedFormatted) { this.usedFormatted = usedFormatted; }

    public String getFreeFormatted() { return freeFormatted; }
    public void setFreeFormatted(String freeFormatted) { this.freeFormatted = freeFormatted; }

    public String getTotalQuotaFormatted() { return totalQuotaFormatted; }
    public void setTotalQuotaFormatted(String totalQuotaFormatted) { this.totalQuotaFormatted = totalQuotaFormatted; }

    public double getUsedPercentage() { return usedPercentage; }
    public void setUsedPercentage(double usedPercentage) { this.usedPercentage = usedPercentage; }

    public long getTotalFiles() { return totalFiles; }
    public void setTotalFiles(long totalFiles) { this.totalFiles = totalFiles; }

    public long getPdfCount() { return pdfCount; }
    public void setPdfCount(long pdfCount) { this.pdfCount = pdfCount; }

    public long getPdfBytes() { return pdfBytes; }
    public void setPdfBytes(long pdfBytes) { this.pdfBytes = pdfBytes; }

    public long getImageCount() { return imageCount; }
    public void setImageCount(long imageCount) { this.imageCount = imageCount; }

    public long getImageBytes() { return imageBytes; }
    public void setImageBytes(long imageBytes) { this.imageBytes = imageBytes; }

    public long getOfficeCount() { return officeCount; }
    public void setOfficeCount(long officeCount) { this.officeCount = officeCount; }

    public long getOfficeBytes() { return officeBytes; }
    public void setOfficeBytes(long officeBytes) { this.officeBytes = officeBytes; }

    public long getOtherCount() { return otherCount; }
    public void setOtherCount(long otherCount) { this.otherCount = otherCount; }

    public long getOtherBytes() { return otherBytes; }
    public void setOtherBytes(long otherBytes) { this.otherBytes = otherBytes; }

    public String getLargestFileName() { return largestFileName; }
    public void setLargestFileName(String largestFileName) { this.largestFileName = largestFileName; }

    public String getLargestFileSizeFormatted() { return largestFileSizeFormatted; }
    public void setLargestFileSizeFormatted(String largestFileSizeFormatted) { this.largestFileSizeFormatted = largestFileSizeFormatted; }
}
