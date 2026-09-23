package com.personal.workspace.repository;

import com.personal.workspace.entity.TaskGitCommitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskGitCommitRepository extends JpaRepository<TaskGitCommitEntity, UUID> {
    List<TaskGitCommitEntity> findByProjectIdOrderByTimestampDesc(UUID projectId);
    List<TaskGitCommitEntity> findByTaskIdOrderByTimestampDesc(UUID taskId);
    List<TaskGitCommitEntity> findByTaskKeyOrderByTimestampDesc(String taskKey);
    Optional<TaskGitCommitEntity> findByCommitHash(String commitHash);
    boolean existsByCommitHash(String commitHash);
    boolean existsByCommitHashAndTaskId(String commitHash, UUID taskId);
}
