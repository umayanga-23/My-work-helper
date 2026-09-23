package com.personal.workspace.repository;

import com.personal.workspace.entity.SkillCertificateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillCertificateRepository extends JpaRepository<SkillCertificateEntity, UUID> {
    List<SkillCertificateEntity> findBySkillId(UUID skillId);
    Optional<SkillCertificateEntity> findByIdAndUserId(UUID id, UUID userId);
    void deleteBySkillId(UUID skillId);
}
