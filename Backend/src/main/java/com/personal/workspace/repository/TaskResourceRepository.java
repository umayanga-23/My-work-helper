package com.personal.workspace.repository;

import com.personal.workspace.entity.TaskResourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskResourceRepository extends JpaRepository<TaskResourceEntity, UUID> {
    List<TaskResourceEntity> findByTaskId(UUID taskId);
    List<TaskResourceEntity> findByResourceId(UUID resourceId);
    long countByResourceId(UUID resourceId);
    void deleteByTaskIdAndResourceId(UUID taskId, UUID resourceId);
    void deleteByResourceId(UUID resourceId);
}
