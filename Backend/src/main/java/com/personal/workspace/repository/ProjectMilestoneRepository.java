package com.personal.workspace.repository;

import com.personal.workspace.entity.ProjectMilestoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestoneEntity, UUID> {
    List<ProjectMilestoneEntity> findByProjectIdOrderByCreatedAtAsc(UUID projectId);
    List<ProjectMilestoneEntity> findByProjectIdOrderByDueDateAsc(UUID projectId);
    long countByProjectIdAndStatus(UUID projectId, String status);
    long countByProjectId(UUID projectId);
}
