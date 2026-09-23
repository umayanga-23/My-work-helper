package com.personal.workspace.repository;

import com.personal.workspace.entity.ActivityLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLogEntity, UUID> {
    List<ActivityLogEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    List<ActivityLogEntity> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    List<ActivityLogEntity> findByUserIdAndProjectIdOrderByCreatedAtDesc(UUID userId, UUID projectId);
    List<ActivityLogEntity> findByEntityIdOrderByCreatedAtDesc(UUID entityId);
}
