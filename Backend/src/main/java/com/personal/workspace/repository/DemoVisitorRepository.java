package com.personal.workspace.repository;

import com.personal.workspace.entity.DemoVisitorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DemoVisitorRepository extends JpaRepository<DemoVisitorEntity, UUID> {

    List<DemoVisitorEntity> findAllByOrderByVisitedAtDesc();
}
