package com.personal.workspace.repository;

import com.personal.workspace.entity.NoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<NoteEntity, UUID> {
    List<NoteEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<NoteEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT n FROM NoteEntity n WHERE n.userId = :userId AND " +
           "(:categoryId IS NULL OR n.categoryId = :categoryId) AND " +
           "(:projectId IS NULL OR n.projectId = :projectId) AND " +
           "(:isFavorite IS NULL OR n.isFavorite = :isFavorite) AND " +
           "(:isArchived IS NULL OR n.isArchived = :isArchived) AND " +
           "(:search IS NULL OR LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(n.content) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(n.tags) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY n.isFavorite DESC, n.updatedAt DESC")
    List<NoteEntity> filterNotes(@Param("userId") UUID userId,
                                 @Param("categoryId") UUID categoryId,
                                 @Param("projectId") UUID projectId,
                                 @Param("isFavorite") Boolean isFavorite,
                                 @Param("isArchived") Boolean isArchived,
                                 @Param("search") String search);
}
