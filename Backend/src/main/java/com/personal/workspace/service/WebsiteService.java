package com.personal.workspace.service;

import com.personal.workspace.dto.WebsiteDTO;
import com.personal.workspace.dto.WebsiteRequest;
import com.personal.workspace.entity.WebsiteEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.TaskResourceRepository;
import com.personal.workspace.repository.WebsiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WebsiteService {

    private final WebsiteRepository websiteRepository;
    private final CategoryRepository categoryRepository;
    private final TaskResourceRepository taskResourceRepository;
    private final ActivityLogService activityLogService;

    public WebsiteService(WebsiteRepository websiteRepository,
                          CategoryRepository categoryRepository,
                          TaskResourceRepository taskResourceRepository,
                          ActivityLogService activityLogService) {
        this.websiteRepository = websiteRepository;
        this.categoryRepository = categoryRepository;
        this.taskResourceRepository = taskResourceRepository;
        this.activityLogService = activityLogService;
    }

    public List<WebsiteDTO> getWebsites(UUID userId, UUID categoryId, UUID projectId, Boolean isFavorite, String search) {
        List<WebsiteEntity> entities = websiteRepository.filterWebsites(userId, categoryId, projectId, isFavorite, search);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<WebsiteDTO> getWebsites(UUID userId, UUID categoryId, Boolean isFavorite, String search) {
        return getWebsites(userId, categoryId, null, isFavorite, search);
    }

    public WebsiteDTO getWebsiteById(UUID userId, UUID id) {
        WebsiteEntity entity = websiteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Website not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public WebsiteDTO createWebsite(UUID userId, WebsiteRequest request) {
        String formattedUrl = formatUrl(request.getUrl());
        String faviconUrl = request.getFaviconUrl();
        if (faviconUrl == null || faviconUrl.trim().isEmpty()) {
            faviconUrl = generateFaviconUrl(formattedUrl);
        }

        WebsiteEntity website = new WebsiteEntity();
        website.setUserId(userId);
        website.setName(request.getName().trim());
        website.setUrl(formattedUrl);
        website.setFaviconUrl(faviconUrl);
        website.setDescription(request.getDescription());
        website.setColor(request.getColor() != null ? request.getColor() : "#0c93e7");
        website.setFavorite(request.isFavorite());
        website.setTags(request.getTags());
        website.setCategoryId(request.getCategoryId());
        website.setProjectId(request.getProjectId());
        website.setVisitCount(0);

        WebsiteEntity saved = websiteRepository.save(website);
        if (saved.getProjectId() != null) {
            activityLogService.logSafe(userId, saved.getProjectId(), "Website added", "WEBSITE", saved.getId(), saved.getName());
        }
        return mapToDTO(saved);
    }

    @Transactional
    public WebsiteDTO updateWebsite(UUID userId, UUID id, WebsiteRequest request) {
        WebsiteEntity website = websiteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Website not found with id: " + id));

        String formattedUrl = formatUrl(request.getUrl());
        String faviconUrl = request.getFaviconUrl();
        if (faviconUrl == null || faviconUrl.trim().isEmpty()) {
            faviconUrl = generateFaviconUrl(formattedUrl);
        }

        website.setName(request.getName().trim());
        website.setUrl(formattedUrl);
        website.setFaviconUrl(faviconUrl);
        website.setDescription(request.getDescription());
        if (request.getColor() != null) website.setColor(request.getColor());
        website.setFavorite(request.isFavorite());
        website.setTags(request.getTags());
        website.setCategoryId(request.getCategoryId());
        website.setProjectId(request.getProjectId());

        WebsiteEntity updated = websiteRepository.save(website);
        return mapToDTO(updated);
    }

    @Transactional
    public WebsiteDTO toggleFavorite(UUID userId, UUID id) {
        WebsiteEntity website = websiteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Website not found with id: " + id));

        website.setFavorite(!website.isFavorite());
        WebsiteEntity updated = websiteRepository.save(website);
        return mapToDTO(updated);
    }

    @Transactional
    public WebsiteDTO recordVisit(UUID userId, UUID id) {
        WebsiteEntity website = websiteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Website not found with id: " + id));

        website.setLastVisitedAt(ZonedDateTime.now());
        int currentVisits = website.getVisitCount() != null ? website.getVisitCount() : 0;
        website.setVisitCount(currentVisits + 1);
        WebsiteEntity updated = websiteRepository.save(website);
        return mapToDTO(updated);
    }

    @Transactional
    public List<WebsiteDTO> importBookmarks(UUID userId, List<WebsiteRequest> requests) {
        List<WebsiteDTO> results = new ArrayList<>();
        for (WebsiteRequest req : requests) {
            if (req.getName() != null && req.getUrl() != null && !req.getUrl().trim().isEmpty()) {
                results.add(createWebsite(userId, req));
            }
        }
        return results;
    }

    @Transactional
    public void deleteWebsite(UUID userId, UUID id) {
        WebsiteEntity website = websiteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Website not found with id: " + id));
        if (website.getProjectId() != null) {
            activityLogService.logSafe(userId, website.getProjectId(), "Website removed", "WEBSITE", website.getId(), website.getName());
        }
        websiteRepository.delete(website);
    }

    public String generateFaviconUrl(String rawUrl) {
        try {
            String domain = extractDomain(rawUrl);
            return "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64";
        } catch (Exception e) {
            return "https://www.google.com/s2/favicons?domain=example.com&sz=64";
        }
    }

    private String formatUrl(String url) {
        if (url == null) return "https://";
        String trimmed = url.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }

    private String extractDomain(String rawUrl) {
        try {
            URI uri = new URI(formatUrl(rawUrl));
            String host = uri.getHost();
            if (host != null) {
                return host.startsWith("www.") ? host.substring(4) : host;
            }
        } catch (Exception ignored) {}
        return "google.com";
    }

    private WebsiteDTO mapToDTO(WebsiteEntity entity) {
        WebsiteDTO dto = new WebsiteDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setProjectId(entity.getProjectId());
        dto.setName(entity.getName());
        dto.setUrl(entity.getUrl());
        dto.setFaviconUrl(entity.getFaviconUrl());
        dto.setDescription(entity.getDescription());
        dto.setColor(entity.getColor());
        dto.setFavorite(entity.isFavorite());
        dto.setVisitCount(entity.getVisitCount());
        dto.setTags(entity.getTags());
        dto.setLastVisitedAt(entity.getLastVisitedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        long linkedTasks = taskResourceRepository.countByResourceId(entity.getId());
        dto.setLinkedTaskCount(linkedTasks);

        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
            });
        }

        return dto;
    }
}
