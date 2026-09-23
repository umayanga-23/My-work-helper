package com.personal.workspace.repository;

import com.personal.workspace.entity.SkillEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<SkillEntity, UUID> {
    List<SkillEntity> findByUserIdOrderByProficiencyPercentDesc(UUID userId);
    Optional<SkillEntity> findByIdAndUserId(UUID id, UUID userId);
}
