package com.personal.workspace.service;

import com.personal.workspace.dto.DriveLinkDTO;
import com.personal.workspace.dto.DriveLinkRequest;
import com.personal.workspace.entity.DriveLinkEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.DriveLinkRepository;
import com.personal.workspace.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DriveLinkService {

    private final DriveLinkRepository driveLinkRepository;
    private final CategoryRepository categoryRepository;
    private final ProjectRepository projectRepository;
    private final ActivityLogService activityLogService;

    public DriveLinkService(DriveLinkRepository driveLinkRepository,
                            CategoryRepository categoryRepository,
                            ProjectRepository projectRepository,
                            ActivityLogService activityLogService) {
        this.driveLinkRepository = driveLinkRepository;
        this.categoryRepository = categoryRepository;
        this.projectRepository = projectRepository;
        this.activityLogService = activityLogService;
    }

    public List<DriveLinkDTO> getDriveLinks(UUID userId, UUID categoryId, UUID projectId, Boolean isFavorite, String search) {
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        List<DriveLinkEntity> entities = driveLinkRepository.filterDriveLinks(userId, categoryId, projectId, isFavorite, searchPattern);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public DriveLinkDTO getDriveLinkById(UUID userId, UUID id) {
        DriveLinkEntity entity = driveLinkRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive link not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public DriveLinkDTO createDriveLink(UUID userId, DriveLinkRequest request) {
        String formattedUrl = formatUrl(request.getUrl());
        String detectedType = (request.getResourceType() != null && !request.getResourceType().isBlank())
                ? request.getResourceType()
                : detectResourceType(formattedUrl);

        DriveLinkEntity link = new DriveLinkEntity();
        link.setUserId(userId);
        link.setName(request.getName().trim());
        link.setUrl(formattedUrl);
        link.setResourceType(detectedType);
        link.setDescription(request.getDescription());
        link.setTags(request.getTags());
        link.setFavorite(request.isFavorite());
        link.setCategoryId(request.getCategoryId());
        link.setProjectId(request.getProjectId());

        DriveLinkEntity saved = driveLinkRepository.save(link);
        if (saved.getProjectId() != null) {
            activityLogService.logSafe(userId, saved.getProjectId(), "Drive resource added", "DRIVE_LINK", saved.getId(), saved.getName());
        }
        return mapToDTO(saved);
    }

    @Transactional
    public DriveLinkDTO updateDriveLink(UUID userId, UUID id, DriveLinkRequest request) {
        DriveLinkEntity link = driveLinkRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive link not found with id: " + id));

        String formattedUrl = formatUrl(request.getUrl());
        String detectedType = (request.getResourceType() != null && !request.getResourceType().isBlank())
                ? request.getResourceType()
                : detectResourceType(formattedUrl);

        link.setName(request.getName().trim());
        link.setUrl(formattedUrl);
        link.setResourceType(detectedType);
        link.setDescription(request.getDescription());
        link.setTags(request.getTags());
        link.setFavorite(request.isFavorite());
        link.setCategoryId(request.getCategoryId());
        link.setProjectId(request.getProjectId());

        DriveLinkEntity updated = driveLinkRepository.save(link);
        return mapToDTO(updated);
    }

    @Transactional
    public DriveLinkDTO toggleFavorite(UUID userId, UUID id) {
        DriveLinkEntity link = driveLinkRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive link not found with id: " + id));

        link.setFavorite(!link.isFavorite());
        DriveLinkEntity updated = driveLinkRepository.save(link);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteDriveLink(UUID userId, UUID id) {
        DriveLinkEntity link = driveLinkRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive link not found with id: " + id));
        if (link.getProjectId() != null) {
            activityLogService.logSafe(userId, link.getProjectId(), "Drive resource removed", "DRIVE_LINK", link.getId(), link.getName());
        }
        driveLinkRepository.delete(link);
    }

    public static String detectResourceType(String url) {
        if (url == null) return "WEB_RESOURCE";
        String lower = url.toLowerCase();

        if (lower.contains("drive.google.com/drive") || lower.contains("drive.google.com/folderview")) {
            return "GOOGLE_DRIVE";
        }
        if (lower.contains("docs.google.com/document")) {
            return "GOOGLE_DOCS";
        }
        if (lower.contains("docs.google.com/spreadsheets") || lower.contains("sheets.google.com")) {
            return "GOOGLE_SHEETS";
        }
        if (lower.contains("docs.google.com/presentation") || lower.contains("slides.google.com")) {
            return "GOOGLE_SLIDES";
        }
        if (lower.contains("drive.google.com") || lower.contains("google.com/drive")) {
            return "GOOGLE_DRIVE";
        }
        if (lower.contains("chatgpt.com") || lower.contains("chat.openai.com")) {
            return "CHATGPT";
        }
        if (lower.contains("youtube.com") || lower.contains("youtu.be")) {
            return "YOUTUBE";
        }
        if (lower.contains("linkedin.com")) {
            return "LINKEDIN";
        }
        if (lower.contains("facebook.com") || lower.contains("fb.watch") || lower.contains("fb.com")) {
            return "FACEBOOK";
        }
        if (lower.contains("github.com") || lower.contains("gitlab.com")) {
            return "GITHUB";
        }

        return "WEB_RESOURCE";
    }

    private String formatUrl(String url) {
        if (url == null) return "https://drive.google.com";
        String trimmed = url.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }

    private DriveLinkDTO mapToDTO(DriveLinkEntity entity) {
        DriveLinkDTO dto = new DriveLinkDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setProjectId(entity.getProjectId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setName(entity.getName());
        dto.setUrl(entity.getUrl());
        dto.setResourceType(entity.getResourceType() != null ? entity.getResourceType() : detectResourceType(entity.getUrl()));
        dto.setDescription(entity.getDescription());
        dto.setTags(entity.getTags());
        dto.setFavorite(entity.isFavorite());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
            });
        }

        if (entity.getProjectId() != null) {
            projectRepository.findById(entity.getProjectId()).ifPresent(proj -> {
                dto.setProjectName(proj.getName());
            });
        }

        return dto;
    }
}
