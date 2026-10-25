package com.personal.workspace.repository;

import com.personal.workspace.entity.FolderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<FolderEntity, UUID> {

    List<FolderEntity> findByUserIdAndTypeOrderByPositionAscNameAsc(UUID userId, String type);

    List<FolderEntity> findByUserIdAndTypeAndParentIdIsNullOrderByPositionAscNameAsc(UUID userId, String type);

    List<FolderEntity> findByUserIdAndParentIdOrderByPositionAscNameAsc(UUID userId, UUID parentId);

    Optional<FolderEntity> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndParentId(UUID userId, UUID parentId);

    @Query("SELECT f FROM FolderEntity f WHERE f.userId = :userId AND f.parentId = :parentId AND LOWER(f.name) = LOWER(:name)")
    Optional<FolderEntity> findByUserIdAndParentIdAndNameIgnoreCase(@Param("userId") UUID userId, @Param("parentId") UUID parentId, @Param("name") String name);

    @Query("SELECT f FROM FolderEntity f WHERE f.userId = :userId AND f.parentId IS NULL AND LOWER(f.name) = LOWER(:name)")
    Optional<FolderEntity> findByUserIdAndParentIdIsNullAndNameIgnoreCase(@Param("userId") UUID userId, @Param("name") String name);
}
