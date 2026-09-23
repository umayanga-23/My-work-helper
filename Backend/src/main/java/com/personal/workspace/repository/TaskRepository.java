package com.personal.workspace.repository;

import com.personal.workspace.entity.TaskEntity;
import com.personal.workspace.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {
    List<TaskEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<TaskEntity> findByIdAndUserId(UUID id, UUID userId);
    List<TaskEntity> findByUserIdAndDueDateOrderByDueTimeAsc(UUID userId, LocalDate dueDate);
    List<TaskEntity> findByUserIdAndStatus(UUID userId, TaskStatus status);
    
    @Query("SELECT t FROM TaskEntity t WHERE t.userId = :userId AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:categoryId IS NULL OR t.categoryId = :categoryId) AND " +
           "(:projectId IS NULL OR t.projectId = :projectId) AND " +
           "(:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY t.createdAt DESC")
    List<TaskEntity> filterTasks(@Param("userId") UUID userId,
                                 @Param("status") TaskStatus status,
                                 @Param("categoryId") UUID categoryId,
                                 @Param("projectId") UUID projectId,
                                 @Param("search") String search);

    long countByUserId(UUID userId);
    long countByUserIdAndStatus(UUID userId, TaskStatus status);
    long countByUserIdAndDueDate(UUID userId, LocalDate dueDate);
    long countByUserIdAndDueDateAndStatus(UUID userId, LocalDate dueDate, TaskStatus status);

    Optional<TaskEntity> findByTaskKey(String taskKey);
    List<TaskEntity> findByProjectId(UUID projectId);
    long countByProjectId(UUID projectId);
    long countByProjectIdAndStatus(UUID projectId, TaskStatus status);

    List<TaskEntity> findByUserIdAndParentTaskIdIsNullOrderByCreatedAtDesc(UUID userId);
    List<TaskEntity> findByParentTaskIdOrderByCreatedAtAsc(UUID parentTaskId);
    List<TaskEntity> findByUserIdAndDueDateBeforeAndStatusNotOrderByDueDateAscDueTimeAsc(UUID userId, LocalDate date, TaskStatus status);

    // ── Scheduling & Calendar Queries ──────────────────────────────────────────
    boolean existsByRecurringTaskIdAndDueDate(UUID recurringTaskId, LocalDate dueDate);
    Optional<TaskEntity> findByRecurringTaskIdAndDueDate(UUID recurringTaskId, LocalDate dueDate);
    List<TaskEntity> findByUserIdAndDueDateBetweenOrderByDueDateAscDueTimeAsc(UUID userId, LocalDate startDate, LocalDate endDate);
}
