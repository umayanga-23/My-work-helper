package com.personal.workspace.repository;

import com.personal.workspace.entity.PasswordResetOtpEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtpEntity, UUID> {

    Optional<PasswordResetOtpEntity> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);
}
