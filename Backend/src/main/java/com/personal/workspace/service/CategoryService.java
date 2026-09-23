package com.personal.workspace.service;

import com.personal.workspace.dto.CategoryDTO;
import com.personal.workspace.dto.CategoryRequest;
import com.personal.workspace.entity.CategoryEntity;
import com.personal.workspace.entity.CategoryType;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDTO> getCategories(UUID userId, CategoryType type) {
        List<CategoryEntity> entities;
        if (type != null) {
            entities = categoryRepository.findByUserIdAndType(userId, type);
        } else {
            entities = categoryRepository.findByUserId(userId);
        }
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public CategoryDTO createCategory(UUID userId, CategoryRequest request) {
        CategoryEntity category = new CategoryEntity(
                userId,
                request.getName().trim(),
                request.getType(),
                request.getColor() != null ? request.getColor() : "#0c93e7",
                request.getIcon()
        );
        CategoryEntity saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Transactional
    public CategoryDTO updateCategory(UUID userId, UUID id, CategoryRequest request) {
        CategoryEntity category = categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        category.setName(request.getName().trim());
        category.setType(request.getType());
        if (request.getColor() != null) category.setColor(request.getColor());
        if (request.getIcon() != null) category.setIcon(request.getIcon());

        CategoryEntity updated = categoryRepository.save(category);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCategory(UUID userId, UUID id) {
        CategoryEntity category = categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        // Safely unlink this category from all resources across the workspace
        entityManager.createQuery("UPDATE NoteEntity n SET n.categoryId = null WHERE n.categoryId = :catId AND n.userId = :userId")
                .setParameter("catId", id)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createQuery("UPDATE WebsiteEntity w SET w.categoryId = null WHERE w.categoryId = :catId AND w.userId = :userId")
                .setParameter("catId", id)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createQuery("UPDATE DocumentEntity d SET d.categoryId = null WHERE d.categoryId = :catId AND d.userId = :userId")
                .setParameter("catId", id)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createQuery("UPDATE DriveLinkEntity dl SET dl.categoryId = null WHERE dl.categoryId = :catId AND dl.userId = :userId")
                .setParameter("catId", id)
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createQuery("UPDATE TaskEntity t SET t.categoryId = null WHERE t.categoryId = :catId AND t.userId = :userId")
                .setParameter("catId", id)
                .setParameter("userId", userId)
                .executeUpdate();

        categoryRepository.delete(category);
    }

    private List<CategoryEntity> seedDefaultCategories(UUID userId) {
        List<CategoryEntity> defaults = Arrays.asList(
                new CategoryEntity(userId, "AI & Machine Learning", CategoryType.WEBSITE, "#8b5cf6", "Sparkles"),
                new CategoryEntity(userId, "University & IT Degree", CategoryType.GENERAL, "#3b82f6", "GraduationCap"),
                new CategoryEntity(userId, "Software Engineering", CategoryType.NOTE, "#10b981", "Code2"),
                new CategoryEntity(userId, "Development & Coding", CategoryType.TASK, "#06b6d4", "Terminal"),
                new CategoryEntity(userId, "Personal Projects", CategoryType.PROJECT, "#ec4899", "Briefcase"),
                new CategoryEntity(userId, "Important Links", CategoryType.WEBSITE, "#f59e0b", "Globe")
        );
        return categoryRepository.saveAll(defaults);
    }

    private CategoryDTO mapToDTO(CategoryEntity entity) {
        return new CategoryDTO(
                entity.getId(),
                entity.getUserId(),
                entity.getName(),
                entity.getType(),
                entity.getColor(),
                entity.getIcon(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
