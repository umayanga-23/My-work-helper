package com.personal.workspace.service;

import com.personal.workspace.dto.ActivityLogDTO;
import com.personal.workspace.entity.ActivityLogEntity;
import com.personal.workspace.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDTO> getUserActivities(UUID userId) {
        return activityLogRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDTO> getProjectActivities(UUID projectId) {
        return activityLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDTO> getEntityActivities(UUID entityId) {
        return activityLogRepository.findByEntityIdOrderByCreatedAtDesc(entityId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActivityLogDTO logActivity(UUID userId, String action, String entityType, UUID entityId, String metadata) {
        return logActivity(userId, null, action, entityType, entityId, metadata);
    }

    @Transactional
    public ActivityLogDTO logActivity(UUID userId, UUID projectId, String action, String entityType, UUID entityId, String metadata) {
        ActivityLogEntity entity = new ActivityLogEntity(userId, projectId, action, entityType, entityId, metadata);
        ActivityLogEntity saved = activityLogRepository.save(entity);
        return mapToDTO(saved);
    }

    @Transactional
    public void logSafe(UUID userId, UUID projectId, String action, String entityType, UUID entityId, String description) {
        try {
            String safeDesc = description != null ? description.replace("\"", "\\\"").replace("\n", " ").trim() : "";
            String metadata = "{\"description\":\"" + safeDesc + "\"}";
            ActivityLogEntity entity = new ActivityLogEntity(userId, projectId, action, entityType, entityId, metadata);
            activityLogRepository.save(entity);
        } catch (Exception e) {
            // Logging failure should never fail the main transaction
        }
    }

    private ActivityLogDTO mapToDTO(ActivityLogEntity entity) {
        return new ActivityLogDTO(
                entity.getId(),
                entity.getUserId(),
                entity.getProjectId(),
                entity.getAction(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getMetadata(),
                entity.getCreatedAt() != null ? entity.getCreatedAt() : ZonedDateTime.now()
        );
    }
}
