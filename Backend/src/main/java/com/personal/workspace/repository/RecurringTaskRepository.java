package com.personal.workspace.repository;

import com.personal.workspace.entity.RecurringTaskEntity;
import com.personal.workspace.entity.RecurringTaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecurringTaskRepository extends JpaRepository<RecurringTaskEntity, UUID> {

    List<RecurringTaskEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<RecurringTaskEntity> findByIdAndUserId(UUID id, UUID userId);

    List<RecurringTaskEntity> findByUserIdAndStatus(UUID userId, RecurringTaskStatus status);

    @Query("SELECT r FROM RecurringTaskEntity r WHERE r.status = :status AND r.startDate <= :date AND (r.endDate IS NULL OR r.endDate >= :date)")
    List<RecurringTaskEntity> findActiveTemplatesForDate(
            @Param("status") RecurringTaskStatus status,
            @Param("date") LocalDate date
    );

    @Query("SELECT r FROM RecurringTaskEntity r WHERE r.userId = :userId AND r.status = :status AND r.startDate <= :date AND (r.endDate IS NULL OR r.endDate >= :date)")
    List<RecurringTaskEntity> findActiveTemplatesForUserAndDate(
            @Param("userId") UUID userId,
            @Param("status") RecurringTaskStatus status,
            @Param("date") LocalDate date
    );

    long countByUserId(UUID userId);
    long countByUserIdAndStatus(UUID userId, RecurringTaskStatus status);
}
