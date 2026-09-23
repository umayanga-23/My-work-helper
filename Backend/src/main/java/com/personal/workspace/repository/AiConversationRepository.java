package com.personal.workspace.repository;

import com.personal.workspace.entity.AiConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversationEntity, UUID> {
    List<AiConversationEntity> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    Optional<AiConversationEntity> findByIdAndUserId(UUID id, UUID userId);
}
