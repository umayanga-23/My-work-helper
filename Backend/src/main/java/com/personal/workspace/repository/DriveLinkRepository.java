package com.personal.workspace.repository;

import com.personal.workspace.entity.DriveLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriveLinkRepository extends JpaRepository<DriveLinkEntity, UUID> {
    List<DriveLinkEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<DriveLinkEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT d FROM DriveLinkEntity d WHERE d.userId = :userId AND " +
           "(:categoryId IS NULL OR d.categoryId = :categoryId) AND " +
           "(:projectId IS NULL OR d.projectId = :projectId) AND " +
           "(:isFavorite IS NULL OR d.isFavorite = :isFavorite) AND " +
           "(:search IS NULL OR LOWER(d.name) LIKE :search OR LOWER(d.url) LIKE :search OR (d.description IS NOT NULL AND LOWER(d.description) LIKE :search)) " +
           "ORDER BY d.isFavorite DESC, d.createdAt DESC")
    List<DriveLinkEntity> filterDriveLinks(@Param("userId") UUID userId,
                                           @Param("categoryId") UUID categoryId,
                                           @Param("projectId") UUID projectId,
                                           @Param("isFavorite") Boolean isFavorite,
                                           @Param("search") String search);
}
