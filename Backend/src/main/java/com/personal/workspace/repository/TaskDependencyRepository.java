package com.personal.workspace.repository;

import com.personal.workspace.entity.TaskDependencyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskDependencyRepository extends JpaRepository<TaskDependencyEntity, UUID> {

    /** All tasks that taskId depends on (i.e. taskId is blocked by these) */
    List<TaskDependencyEntity> findByTaskId(UUID taskId);

    /** All tasks that depend on dependsOnTaskId (i.e. these are blocked by dependsOnTaskId) */
    List<TaskDependencyEntity> findByDependsOnTaskId(UUID dependsOnTaskId);

    /** Check if a specific dependency already exists */
    Optional<TaskDependencyEntity> findByTaskIdAndDependsOnTaskId(UUID taskId, UUID dependsOnTaskId);

    /** Delete by both IDs */
    void deleteByTaskIdAndDependsOnTaskId(UUID taskId, UUID dependsOnTaskId);

    /** Delete all dependencies involving a task (when task is deleted) */
    void deleteByTaskIdOrDependsOnTaskId(UUID taskId, UUID dependsOnTaskId);

    /**
     * Circular dependency check using recursive BFS in Java layer.
     * Fetches all tasks that 'startTaskId' eventually depends on.
     */
    @Query("SELECT d.dependsOnTaskId FROM TaskDependencyEntity d WHERE d.taskId = :taskId")
    List<UUID> findDirectDependsOnIds(@Param("taskId") UUID taskId);
}
