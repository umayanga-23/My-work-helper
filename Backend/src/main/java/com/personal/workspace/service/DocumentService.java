package com.personal.workspace.service;

import com.personal.workspace.dto.DocumentDTO;
import com.personal.workspace.dto.DocumentRequest;
import com.personal.workspace.entity.DocumentEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.DocumentRepository;
import com.personal.workspace.repository.FolderRepository;
import com.personal.workspace.repository.TaskResourceRepository;
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
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final FolderRepository folderRepository;
    private final ActivityLogService activityLogService;
    private final TaskResourceRepository taskResourceRepository;
    private final HttpClient httpClient;

    @Value("${supabase.url:https://ngeokbpgmtqbijjvonnw.supabase.co}")
    private String supabaseUrl;

    @Value("${supabase.storage-bucket:workspace-documents}")
    private String storageBucket;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    @Value("${supabase.anon-key:}")
    private String anonKey;

    public DocumentService(DocumentRepository documentRepository,
                           CategoryRepository categoryRepository,
                           FolderRepository folderRepository,
                           ActivityLogService activityLogService,
                           TaskResourceRepository taskResourceRepository) {
        this.documentRepository = documentRepository;
        this.categoryRepository = categoryRepository;
        this.folderRepository = folderRepository;
        this.activityLogService = activityLogService;
        this.taskResourceRepository = taskResourceRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    public List<DocumentDTO> getDocuments(UUID userId, UUID folderId, UUID categoryId, UUID projectId, String search) {
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        List<DocumentEntity> entities = documentRepository.filterDocuments(userId, folderId, categoryId, projectId, searchPattern);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<DocumentDTO> getDocuments(UUID userId, UUID categoryId, UUID projectId, String search) {
        return getDocuments(userId, null, categoryId, projectId, search);
    }

    public DocumentDTO getDocumentById(UUID userId, UUID id) {
        DocumentEntity entity = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public DocumentDTO uploadDocumentFile(UUID userId, MultipartFile file, String name, UUID folderId, UUID categoryId, UUID projectId, String description, String tags) {
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
        boolean uploadedToSupabase = false;

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Could not read uploaded file content: " + e.getMessage(), e);
        }

        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        String authKey = (serviceRoleKey != null && !serviceRoleKey.isBlank()) ? serviceRoleKey : anonKey;

        // Try Supabase Storage REST upload with 30s timeout
        if (authKey != null && !authKey.isBlank()) {
            try {
                String uploadUri = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, storageBucket, storagePath);
                HttpRequest uploadRequest = HttpRequest.newBuilder()
                        .uri(URI.create(uploadUri))
                        .header("Authorization", "Bearer " + authKey)
                        .header("apikey", authKey)
                        .header("Content-Type", contentType)
                        .timeout(Duration.ofSeconds(30))
                        .POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
                        .build();

                HttpResponse<String> response = httpClient.send(uploadRequest, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("Successfully uploaded file to Supabase Storage bucket {}: {}", storageBucket, storagePath);
                    uploadedToSupabase = true;
                } else {
                    log.warn("Supabase Storage returned status {}: {}. Activating secure internal vault storage fallback.", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Supabase Storage upload connection error ({}: {}). Activating secure internal vault storage fallback.", e.getClass().getSimpleName(), e.getMessage());
            }
        } else {
            log.info("Supabase storage key not configured. Using secure internal vault storage fallback.");
        }

        DocumentEntity doc = new DocumentEntity();
        doc.setUserId(userId);
        doc.setName(cleanName);
        doc.setOriginalFileName(originalFilename);
        doc.setFileType(contentType);
        doc.setFileSize(file.getSize());
        doc.setFolderId(folderId);
        doc.setCategoryId(categoryId);
        doc.setProjectId(projectId);
        doc.setDescription(description);
        doc.setTags(tags);
        doc.setIsFavorite(false);

        if (uploadedToSupabase) {
            doc.setFilePath(storagePath);
        } else {
            // Resilient internal storage: store Base64 in PostgreSQL so upload NEVER fails
            doc.setFilePath("local:" + storagePath);
            doc.setFileContent(Base64.getEncoder().encodeToString(fileBytes));
            log.info("Document '{}' stored safely in PostgreSQL vault", cleanName);
        }

        DocumentEntity saved = documentRepository.save(doc);
        if (saved.getProjectId() != null) {
            activityLogService.logSafe(userId, saved.getProjectId(), "Document added", "DOCUMENT", saved.getId(), saved.getName());
        }
        return mapToDTO(saved);
    }

    @Transactional
    public DocumentDTO uploadDocumentFile(UUID userId, MultipartFile file, String name, UUID categoryId, UUID projectId, String description, String tags) {
        return uploadDocumentFile(userId, file, name, null, categoryId, projectId, description, tags);
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
        doc.setFolderId(request.getFolderId());
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
    public DocumentDTO updateDocument(UUID userId, UUID id, DocumentRequest request) {
        DocumentEntity doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        doc.setName(request.getName().trim());
        if (request.getCategoryId() != null) doc.setCategoryId(request.getCategoryId());
        if (request.getFolderId() != null) doc.setFolderId(request.getFolderId());
        if (request.getProjectId() != null) doc.setProjectId(request.getProjectId());
        if (request.getDescription() != null) doc.setDescription(request.getDescription());
        if (request.getTags() != null) doc.setTags(request.getTags());
        if (request.getIsFavorite() != null) doc.setIsFavorite(request.getIsFavorite());

        DocumentEntity updated = documentRepository.save(doc);
        return mapToDTO(updated);
    }

    @Transactional
    public DocumentDTO toggleFavorite(UUID userId, UUID id) {
        DocumentEntity doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        boolean next = doc.getIsFavorite() == null || !doc.getIsFavorite();
        doc.setIsFavorite(next);
        return mapToDTO(documentRepository.save(doc));
    }

    @Transactional
    public void deleteDocument(UUID userId, UUID id) {
        DocumentEntity doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        taskResourceRepository.deleteByResourceId(doc.getId());

        String filePath = doc.getFilePath();
        if (filePath != null && !filePath.isBlank() && !filePath.startsWith("local:")) {
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

        if (doc.getFilePath() != null && doc.getFilePath().startsWith("local:")) {
            return "/api/documents/" + id + "/file";
        }
        return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, storageBucket, doc.getFilePath());
    }

    public byte[] getFileBytes(UUID userId, UUID id) {
        DocumentEntity doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        if (doc.getFileContent() != null && !doc.getFileContent().isBlank()) {
            return Base64.getDecoder().decode(doc.getFileContent());
        }
        return new byte[0];
    }

    private DocumentDTO mapToDTO(DocumentEntity entity) {
        DocumentDTO dto = new DocumentDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setProjectId(entity.getProjectId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setFolderId(entity.getFolderId());
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

        if (entity.getFilePath() != null && entity.getFilePath().startsWith("local:")) {
            dto.setDownloadUrl("/api/documents/" + entity.getId() + "/file");
        } else {
            dto.setDownloadUrl(String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, storageBucket, entity.getFilePath()));
        }

        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> dto.setCategoryName(cat.getName()));
        }

        if (entity.getFolderId() != null) {
            folderRepository.findById(entity.getFolderId()).ifPresent(f -> dto.setFolderName(f.getName()));
        }

        return dto;
    }
}
