package com.personal.workspace.repository;

import com.personal.workspace.entity.SkillProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillProjectRepository extends JpaRepository<SkillProjectEntity, UUID> {
    List<SkillProjectEntity> findBySkillId(UUID skillId);
    Optional<SkillProjectEntity> findBySkillIdAndProjectId(UUID skillId, UUID projectId);
    void deleteBySkillIdAndProjectId(UUID skillId, UUID projectId);
    void deleteBySkillId(UUID skillId);
}
