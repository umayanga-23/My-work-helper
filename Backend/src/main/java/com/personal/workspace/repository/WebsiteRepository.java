package com.personal.workspace.repository;

import com.personal.workspace.entity.WebsiteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebsiteRepository extends JpaRepository<WebsiteEntity, UUID> {
    List<WebsiteEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<WebsiteEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT w FROM WebsiteEntity w WHERE w.userId = :userId AND " +
           "(:categoryId IS NULL OR w.categoryId = :categoryId) AND " +
           "(:projectId IS NULL OR w.projectId = :projectId) AND " +
           "(:isFavorite IS NULL OR w.isFavorite = :isFavorite) AND " +
           "(:search IS NULL OR LOWER(w.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(w.url) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(w.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(w.tags) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY w.isFavorite DESC, w.createdAt DESC")
    List<WebsiteEntity> filterWebsites(@Param("userId") UUID userId,
                                       @Param("categoryId") UUID categoryId,
                                       @Param("projectId") UUID projectId,
                                       @Param("isFavorite") Boolean isFavorite,
                                       @Param("search") String search);
}
