package com.personal.workspace.service;

import com.personal.workspace.dto.DocumentDTO;
import com.personal.workspace.dto.DocumentRequest;
import com.personal.workspace.entity.DocumentEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final HttpClient httpClient;

    @Value("${supabase.url:https://ngeokbpgmtqbijjvonnw.supabase.co}")
    private String supabaseUrl;

    @Value("${supabase.storage-bucket:workspace-documents}")
    private String storageBucket;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    @Value("${supabase.anon-key:}")
    private String anonKey;

    private final ActivityLogService activityLogService;
    private final com.personal.workspace.repository.TaskResourceRepository taskResourceRepository;

    public DocumentService(DocumentRepository documentRepository,
                           CategoryRepository categoryRepository,
                           ActivityLogService activityLogService,
                           com.personal.workspace.repository.TaskResourceRepository taskResourceRepository) {
        this.documentRepository = documentRepository;
        this.categoryRepository = categoryRepository;
        this.activityLogService = activityLogService;
        this.taskResourceRepository = taskResourceRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public List<DocumentDTO> getDocuments(UUID userId, UUID categoryId, UUID projectId, String search) {
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        List<DocumentEntity> entities = documentRepository.filterDocuments(userId, categoryId, projectId, searchPattern);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public DocumentDTO getDocumentById(UUID userId, UUID id) {
        DocumentEntity entity = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public DocumentDTO uploadDocumentFile(UUID userId, MultipartFile file, String name, UUID categoryId, UUID projectId, String description, String tags) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.bin";
        String cleanName = (name != null && !name.isBlank()) ? name.trim() : originalFilename;
        String extension = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx >= 0) {
            extension = originalFilename.substring(dotIdx);
        }

        String storageFileName = String.format("%s_%d%s", UUID.randomUUID().toString().substring(0, 8), System.currentTimeMillis(), extension);
        String storagePath = storageFileName;

        // Upload directly to Supabase Storage via REST
        try {
            byte[] fileBytes = file.getBytes();
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            
            String uploadUri = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, storageBucket, storagePath);
            String authKey = (serviceRoleKey != null && !serviceRoleKey.isBlank()) ? serviceRoleKey : anonKey;

            HttpRequest uploadRequest = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUri))
                    .header("Authorization", "Bearer " + authKey)
                    .header("apikey", authKey)
                    .header("Content-Type", contentType)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
                    .build();

            HttpResponse<String> response = httpClient.send(uploadRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully uploaded file to Supabase Storage bucket {}: {}", storageBucket, storagePath);
            } else {
                log.error("Supabase Storage upload failed with status {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Supabase Storage upload failed: " + response.body());
            }
        } catch (IOException | InterruptedException e) {
            log.error("Error uploading document to Supabase Storage", e);
            throw new RuntimeException("Failed to upload document to Supabase: " + e.getMessage(), e);
        }

        DocumentEntity doc = new DocumentEntity();
        doc.setUserId(userId);
        doc.setName(cleanName);
        doc.setOriginalFileName(originalFilename);
        doc.setFilePath(storagePath);
        doc.setFileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        doc.setFileSize(file.getSize());
        doc.setCategoryId(categoryId);
        doc.setProjectId(projectId);
        doc.setDescription(description);
        doc.setTags(tags);
        doc.setIsFavorite(false);

        DocumentEntity saved = documentRepository.save(doc);
        if (saved.getProjectId() != null) {
            activityLogService.logSafe(userId, saved.getProjectId(), "Document added", "DOCUMENT", saved.getId(), saved.getName());
        }
        return mapToDTO(saved);
    }

    @Transactional
    public DocumentDTO createDocument(UUID userId, DocumentRequest request) {
        DocumentEntity doc = new DocumentEntity();
        doc.setUserId(userId);
        doc.setName(request.getName().trim());
        doc.setOriginalFileName(request.getOriginalFileName().trim());
        doc.setFilePath(request.getFilePath().trim());
        doc.setFileType(request.getFileType() != null ? request.getFileType() : "application/octet-stream");
        doc.setFileSize(request.getFileSize());
        doc.setCategoryId(request.getCategoryId());
        doc.setProjectId(request.getProjectId());
        doc.setDescription(request.getDescription());
        doc.setTags(request.getTags());
        doc.setIsFavorite(request.getIsFavorite() != null ? request.getIsFavorite() : false);

        DocumentEntity saved = documentRepository.save(doc);
        if (saved.getProjectId() != null) {
            activityLogService.logSafe(userId, saved.getProjectId(), "Document added", "DOCUMENT", saved.getId(), saved.getName());
        }
        return mapToDTO(saved);
    }

    @Transactional
    public DocumentDTO toggleFavorite(UUID userId, UUID id) {
        DocumentEntity doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        boolean current = doc.getIsFavorite() != null ? doc.getIsFavorite() : false;
        doc.setIsFavorite(!current);
        DocumentEntity saved = documentRepository.save(doc);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteDocument(UUID userId, UUID id) {
        DocumentEntity doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        if (doc.getProjectId() != null) {
            activityLogService.logSafe(userId, doc.getProjectId(), "Document removed", "DOCUMENT", doc.getId(), doc.getName());
        }

        // Unlink from task resources
        try {
            taskResourceRepository.deleteByResourceId(id);
        } catch (Exception e) {
            log.warn("Could not unlink task resources for doc {}: {}", id, e.getMessage());
        }

        // Clean up from Supabase Storage asynchronously with timeout so database deletion is instant and never hangs
        String filePath = doc.getFilePath();
        if (filePath != null && !filePath.isBlank()) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    String deleteUri = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, storageBucket, filePath);
                    String authKey = (serviceRoleKey != null && !serviceRoleKey.isBlank()) ? serviceRoleKey : anonKey;

                    HttpRequest deleteRequest = HttpRequest.newBuilder()
                            .uri(URI.create(deleteUri))
                            .header("Authorization", "Bearer " + authKey)
                            .header("apikey", authKey)
                            .timeout(Duration.ofSeconds(3))
                            .DELETE()
                            .build();

                    httpClient.send(deleteRequest, HttpResponse.BodyHandlers.discarding());
                } catch (Exception e) {
                    log.warn("Could not delete file from Supabase storage: {}", e.getMessage());
                }
            });
        }

        documentRepository.delete(doc);
    }

    public String generateDownloadUrl(UUID userId, UUID id) {
        DocumentEntity doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        
        return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, storageBucket, doc.getFilePath());
    }

    private DocumentDTO mapToDTO(DocumentEntity entity) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setProjectId(entity.getProjectId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setName(entity.getName());
        dto.setOriginalFileName(entity.getOriginalFileName());
        dto.setFilePath(entity.getFilePath());
        dto.setFileType(entity.getFileType());
        dto.setFileSize(entity.getFileSize());
        dto.setIsFavorite(entity.getIsFavorite() != null ? entity.getIsFavorite() : false);
        dto.setDescription(entity.getDescription());
        dto.setTags(entity.getTags());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setDownloadUrl(String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, storageBucket, entity.getFilePath()));

        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
            });
        }

        return dto;
    }
}
