package com.personal.workspace.repository;

import com.personal.workspace.entity.LearningTopicEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningTopicRepository extends JpaRepository<LearningTopicEntity, UUID> {
    List<LearningTopicEntity> findBySkillId(UUID skillId);
    Optional<LearningTopicEntity> findByIdAndUserId(UUID id, UUID userId);
}
