package com.personal.workspace.service;

import com.personal.workspace.dto.SupabaseStorageMetricsDTO;
import com.personal.workspace.dto.SystemMetricsDTO;
import com.personal.workspace.entity.DocumentEntity;
import com.personal.workspace.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;
    private final WebsiteRepository websiteRepository;
    private final DocumentRepository documentRepository;
    private final DriveLinkRepository driveLinkRepository;
    private final ProjectRepository projectRepository;
    private final SkillRepository skillRepository;
    private final IdeaRepository ideaRepository;
    private final CredentialRepository credentialRepository;
    private final ActivityLogRepository activityLogRepository;

    @Value("${supabase.storage-bucket:workspace-documents}")
    private String storageBucket;

    // Supabase Free Tier standard file storage quota is 1 GB (1,073,741,824 bytes)
    private static final long DEFAULT_QUOTA_BYTES = 1024L * 1024L * 1024L;

    public AdminService(
            TaskRepository taskRepository,
            NoteRepository noteRepository,
            WebsiteRepository websiteRepository,
            DocumentRepository documentRepository,
            DriveLinkRepository driveLinkRepository,
            ProjectRepository projectRepository,
            SkillRepository skillRepository,
            IdeaRepository ideaRepository,
            CredentialRepository credentialRepository,
            ActivityLogRepository activityLogRepository) {
        this.taskRepository = taskRepository;
        this.noteRepository = noteRepository;
        this.websiteRepository = websiteRepository;
        this.documentRepository = documentRepository;
        this.driveLinkRepository = driveLinkRepository;
        this.projectRepository = projectRepository;
        this.skillRepository = skillRepository;
        this.ideaRepository = ideaRepository;
        this.credentialRepository = credentialRepository;
        this.activityLogRepository = activityLogRepository;
    }

    public SystemMetricsDTO getSystemMetrics() {
        Runtime runtime = Runtime.getRuntime();
        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();

        long uptimeSeconds = runtimeMXBean.getUptime() / 1000;
        long totalMemoryMb = runtime.totalMemory() / (1024 * 1024);
        long freeMemoryMb = runtime.freeMemory() / (1024 * 1024);
        long maxMemoryMb = runtime.maxMemory() / (1024 * 1024);

        Map<String, Long> tableCounts = new HashMap<>();
        tableCounts.put("tasks", taskRepository.count());
        tableCounts.put("notes", noteRepository.count());
        tableCounts.put("websites", websiteRepository.count());
        tableCounts.put("documents", documentRepository.count());
        tableCounts.put("drive_links", driveLinkRepository.count());
        tableCounts.put("projects", projectRepository.count());
        tableCounts.put("skills", skillRepository.count());
        tableCounts.put("ideas", ideaRepository.count());
        tableCounts.put("credentials", credentialRepository.count());
        tableCounts.put("activity_logs", activityLogRepository.count());

        SystemMetricsDTO dto = new SystemMetricsDTO();
        dto.setStatus("HEALTHY");
        dto.setUptimeSeconds(uptimeSeconds);
        dto.setJavaVersion(System.getProperty("java.version"));
        dto.setOsName(System.getProperty("os.name") + " " + System.getProperty("os.arch"));
        dto.setTotalMemoryMb(totalMemoryMb);
        dto.setFreeMemoryMb(freeMemoryMb);
        dto.setMaxMemoryMb(maxMemoryMb);
        dto.setSupabaseStorageStatus("CONNECTED");
        dto.setDatabaseTableCounts(tableCounts);

        // Supabase Live Storage Metrics
        dto.setSupabaseStorageMetrics(calculateSupabaseStorageMetrics());

        return dto;
    }

    public SupabaseStorageMetricsDTO getSupabaseStorageMetrics() {
        return calculateSupabaseStorageMetrics();
    }

    private SupabaseStorageMetricsDTO calculateSupabaseStorageMetrics() {
        SupabaseStorageMetricsDTO storageDTO = new SupabaseStorageMetricsDTO();
        storageDTO.setBucketName(storageBucket);
        storageDTO.setStatus("LIVE & CONNECTED");
        storageDTO.setTotalQuotaBytes(DEFAULT_QUOTA_BYTES);
        storageDTO.setTotalQuotaFormatted(formatBytes(DEFAULT_QUOTA_BYTES));

        List<DocumentEntity> docs = documentRepository.findAll();
        long totalUsedBytes = 0;
        long pdfCount = 0;
        long pdfBytes = 0;
        long imgCount = 0;
        long imgBytes = 0;
        long officeCount = 0;
        long officeBytes = 0;
        long otherCount = 0;
        long otherBytes = 0;

        String largestName = null;
        long largestSize = 0;

        for (DocumentEntity d : docs) {
            long size = d.getFileSize();
            totalUsedBytes += size;

            if (size > largestSize) {
                largestSize = size;
                largestName = d.getName() != null ? d.getName() : d.getOriginalFileName();
            }

            String type = d.getFileType() != null ? d.getFileType().toLowerCase() : "";
            String name = d.getOriginalFileName() != null ? d.getOriginalFileName().toLowerCase() : "";

            if (type.contains("pdf") || name.endsWith(".pdf")) {
                pdfCount++;
                pdfBytes += size;
            } else if (type.contains("image") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp") || name.endsWith(".svg")) {
                imgCount++;
                imgBytes += size;
            } else if (type.contains("word") || type.contains("excel") || type.contains("sheet") || type.contains("presentation") || name.endsWith(".doc") || name.endsWith(".docx") || name.endsWith(".xls") || name.endsWith(".xlsx") || name.endsWith(".ppt") || name.endsWith(".pptx")) {
                officeCount++;
                officeBytes += size;
            } else {
                otherCount++;
                otherBytes += size;
            }
        }

        storageDTO.setUsedBytes(totalUsedBytes);
        storageDTO.setUsedFormatted(formatBytes(totalUsedBytes));
        long freeBytes = Math.max(0, DEFAULT_QUOTA_BYTES - totalUsedBytes);
        storageDTO.setFreeFormatted(formatBytes(freeBytes));
        double percent = (totalUsedBytes * 100.0) / DEFAULT_QUOTA_BYTES;
        storageDTO.setUsedPercentage(Math.round(percent * 100.0) / 100.0);
        storageDTO.setTotalFiles(docs.size());

        storageDTO.setPdfCount(pdfCount);
        storageDTO.setPdfBytes(pdfBytes);
        storageDTO.setImageCount(imgCount);
        storageDTO.setImageBytes(imgBytes);
        storageDTO.setOfficeCount(officeCount);
        storageDTO.setOfficeBytes(officeBytes);
        storageDTO.setOtherCount(otherCount);
        storageDTO.setOtherBytes(otherBytes);

        storageDTO.setLargestFileName(largestName != null ? largestName : "None");
        storageDTO.setLargestFileSizeFormatted(largestSize > 0 ? formatBytes(largestSize) : "0 B");

        return storageDTO;
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int z = (63 - Long.numberOfLeadingZeros(bytes)) / 10;
        return String.format("%.2f %sB", (double) bytes / (1L << (z * 10)), " KMGTPE".charAt(z));
    }
}
