package com.personal.workspace.repository;

import com.personal.workspace.entity.CategoryEntity;
import com.personal.workspace.entity.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {
    List<CategoryEntity> findByUserId(UUID userId);
    List<CategoryEntity> findByUserIdAndType(UUID userId, CategoryType type);
    Optional<CategoryEntity> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByUserIdAndNameAndType(UUID userId, String name, CategoryType type);
}
