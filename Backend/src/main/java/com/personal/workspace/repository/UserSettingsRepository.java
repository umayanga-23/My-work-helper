package com.personal.workspace.repository;

import com.personal.workspace.entity.UserSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettingsEntity, UUID> {
    Optional<UserSettingsEntity> findByUserId(UUID userId);
}
