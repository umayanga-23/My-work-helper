package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.RecurringTaskDTO;
import com.personal.workspace.dto.RecurringTaskRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.RecurringTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/recurring-tasks")
public class RecurringTaskController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final RecurringTaskService recurringTaskService;

    public RecurringTaskController(RecurringTaskService recurringTaskService) {
        this.recurringTaskService = recurringTaskService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RecurringTaskDTO>>> getRecurringTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<RecurringTaskDTO> tasks = recurringTaskService.getRecurringTasks(userId);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RecurringTaskDTO>> getRecurringTaskById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        RecurringTaskDTO task = recurringTaskService.getRecurringTaskById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(task));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RecurringTaskDTO>> createRecurringTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RecurringTaskRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        RecurringTaskDTO created = recurringTaskService.createRecurringTask(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Recurring task template created", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RecurringTaskDTO>> updateRecurringTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody RecurringTaskRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        RecurringTaskDTO updated = recurringTaskService.updateRecurringTask(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Recurring task template updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRecurringTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        recurringTaskService.deleteRecurringTask(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Recurring task template deleted", null));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<ApiResponse<RecurringTaskDTO>> pauseRecurringTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        RecurringTaskDTO paused = recurringTaskService.pauseRecurringTask(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Recurring task template paused", paused));
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<ApiResponse<RecurringTaskDTO>> resumeRecurringTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        RecurringTaskDTO resumed = recurringTaskService.resumeRecurringTask(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Recurring task template resumed", resumed));
    }

    @PostMapping("/generate-today")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateTodayTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String date) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        LocalDate targetDate = (date != null && !date.trim().isEmpty()) ? LocalDate.parse(date.trim()) : LocalDate.now();
        Map<String, Object> stats = recurringTaskService.generateInstancesForDate(targetDate, userId);
        return ResponseEntity.ok(ApiResponse.success("Task instances generated for " + targetDate, stats));
    }
}
