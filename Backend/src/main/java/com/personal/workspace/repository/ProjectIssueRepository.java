package com.personal.workspace.repository;

import com.personal.workspace.entity.ProjectIssueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectIssueRepository extends JpaRepository<ProjectIssueEntity, UUID> {
    List<ProjectIssueEntity> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    List<ProjectIssueEntity> findByProjectId(UUID projectId);
    long countByProjectIdAndStatus(UUID projectId, String status);
    long countByProjectId(UUID projectId);
}
