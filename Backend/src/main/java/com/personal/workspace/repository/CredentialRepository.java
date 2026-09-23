package com.personal.workspace.repository;

import com.personal.workspace.entity.CredentialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CredentialRepository extends JpaRepository<CredentialEntity, UUID> {
    List<CredentialEntity> findByUserIdOrderByServiceNameAsc(UUID userId);
    Optional<CredentialEntity> findByIdAndUserId(UUID id, UUID userId);
}
