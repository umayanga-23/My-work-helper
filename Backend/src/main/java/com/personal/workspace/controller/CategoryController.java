package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.CategoryDTO;
import com.personal.workspace.dto.CategoryRequest;
import com.personal.workspace.entity.CategoryType;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getCategories(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) CategoryType type) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<CategoryDTO> categories = categoryService.getCategories(userId, type);
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDTO>> createCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CategoryRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        CategoryDTO category = categoryService.createCategory(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Category created successfully", category), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDTO>> updateCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        CategoryDTO updated = categoryService.updateCategory(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        categoryService.deleteCategory(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }
}
