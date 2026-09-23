package com.personal.workspace.controller;

import com.personal.workspace.dto.*;
import com.personal.workspace.entity.ResourceType;
import com.personal.workspace.entity.TaskStatus;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String search) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<TaskDTO> tasks = taskService.getTasks(userId, status, categoryId, projectId, search);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTodayTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<TaskDTO> tasks = taskService.getTodayTasks(userId);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasksForCalendar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        java.time.LocalDate start = (startDate != null && !startDate.trim().isEmpty()) ? java.time.LocalDate.parse(startDate.trim()) : null;
        java.time.LocalDate end = (endDate != null && !endDate.trim().isEmpty()) ? java.time.LocalDate.parse(endDate.trim()) : null;
        List<TaskDTO> tasks = taskService.getTasksForCalendar(userId, start, end);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/summary/today")
    public ResponseEntity<ApiResponse<TaskSummaryDTO>> getTodaySummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskSummaryDTO summary = taskService.getTodaySummary(userId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDTO>> getTaskById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskDTO task = taskService.getTaskById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(task));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskDTO>> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskDTO created = taskService.createTask(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Task created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskDTO updated = taskService.updateTask(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTaskStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam TaskStatus status) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskDTO updated = taskService.updateTaskStatus(userId, id, status);
        return ResponseEntity.ok(ApiResponse.success("Task status updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        taskService.deleteTask(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getOverdueTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<TaskDTO> tasks = taskService.getOverdueTasks(userId);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @PostMapping("/{id}/subtasks")
    public ResponseEntity<ApiResponse<TaskDTO>> createSubtask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskDTO created = taskService.createSubtask(userId, id, request);
        return new ResponseEntity<>(ApiResponse.success("Subtask created successfully", created), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/reschedule-today")
    public ResponseEntity<ApiResponse<TaskDTO>> rescheduleTaskToToday(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskDTO updated = taskService.rescheduleTaskToToday(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Task rescheduled to today", updated));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<List<ActivityLogDTO>>> getTaskActivity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<ActivityLogDTO> activities = taskService.getTaskActivity(userId, id);
        return ResponseEntity.ok(ApiResponse.success(activities));
    }

    @PostMapping("/{id}/resources")
    public ResponseEntity<ApiResponse<TaskResourceDTO>> addResource(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam ResourceType resourceType,
            @RequestParam UUID resourceId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TaskResourceDTO resource = taskService.addResourceToTask(userId, id, resourceType, resourceId);
        return ResponseEntity.ok(ApiResponse.success("Resource linked to task", resource));
    }

    @DeleteMapping("/{id}/resources/{resourceLinkId}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID resourceLinkId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        taskService.deleteResourceFromTask(userId, id, resourceLinkId);
        return ResponseEntity.ok(ApiResponse.success("Resource unlinked from task", null));
    }

    // ─── Task Dependencies ─────────────────────────────────────────────────────

    @PostMapping("/{id}/dependencies")
    public ResponseEntity<ApiResponse<Void>> addDependency(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam UUID dependsOnId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        taskService.addDependency(userId, id, dependsOnId);
        return ResponseEntity.ok(ApiResponse.success("Dependency added", null));
    }

    @DeleteMapping("/{id}/dependencies/{dependsOnId}")
    public ResponseEntity<ApiResponse<Void>> removeDependency(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID dependsOnId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        taskService.removeDependency(userId, id, dependsOnId);
        return ResponseEntity.ok(ApiResponse.success("Dependency removed", null));
    }
}

