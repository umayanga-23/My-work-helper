package com.personal.workspace.repository;

import com.personal.workspace.entity.ProjectEntity;
import com.personal.workspace.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, UUID> {
    List<ProjectEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<ProjectEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT p FROM ProjectEntity p WHERE p.userId = :userId AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.updatedAt DESC")
    List<ProjectEntity> filterProjects(@Param("userId") UUID userId,
                                       @Param("status") ProjectStatus status,
                                       @Param("search") String search);
}
