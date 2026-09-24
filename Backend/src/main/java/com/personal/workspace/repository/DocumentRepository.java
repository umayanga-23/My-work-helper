package com.personal.workspace.repository;

import com.personal.workspace.entity.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, UUID> {
    List<DocumentEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<DocumentEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT d FROM DocumentEntity d WHERE d.userId = :userId AND " +
           "(:categoryId IS NULL OR d.categoryId = :categoryId) AND " +
           "(:projectId IS NULL OR d.projectId = :projectId) AND " +
           "(:search IS NULL OR LOWER(d.name) LIKE :search OR (d.originalFileName IS NOT NULL AND LOWER(d.originalFileName) LIKE :search)) " +
           "ORDER BY d.createdAt DESC")
    List<DocumentEntity> filterDocuments(@Param("userId") UUID userId,
                                         @Param("categoryId") UUID categoryId,
                                         @Param("projectId") UUID projectId,
                                         @Param("search") String search);
}
