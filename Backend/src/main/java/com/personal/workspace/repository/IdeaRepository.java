package com.personal.workspace.repository;

import com.personal.workspace.entity.IdeaEntity;
import com.personal.workspace.entity.IdeaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdeaRepository extends JpaRepository<IdeaEntity, UUID> {
    List<IdeaEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<IdeaEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT i FROM IdeaEntity i WHERE i.userId = :userId AND " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.tags) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.createdAt DESC")
    List<IdeaEntity> filterIdeas(@Param("userId") UUID userId,
                                 @Param("status") IdeaStatus status,
                                 @Param("search") String search);
}
