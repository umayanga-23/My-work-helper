package com.personal.workspace.repository;

import com.personal.workspace.entity.LearningResourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningResourceRepository extends JpaRepository<LearningResourceEntity, UUID> {
    List<LearningResourceEntity> findBySkillId(UUID skillId);
    List<LearningResourceEntity> findByTopicId(UUID topicId);
    Optional<LearningResourceEntity> findByIdAndUserId(UUID id, UUID userId);
    void deleteBySkillId(UUID skillId);
    void deleteByTopicId(UUID topicId);
}
