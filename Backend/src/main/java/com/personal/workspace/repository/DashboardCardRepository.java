package com.personal.workspace.repository;

import com.personal.workspace.entity.DashboardCardEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DashboardCardRepository extends JpaRepository<DashboardCardEntity, UUID> {
    List<DashboardCardEntity> findByUserIdOrderByPositionAsc(UUID userId);
    List<DashboardCardEntity> findByUserIdAndIsVisibleTrueOrderByPositionAsc(UUID userId);
    Optional<DashboardCardEntity> findByIdAndUserId(UUID id, UUID userId);
}
