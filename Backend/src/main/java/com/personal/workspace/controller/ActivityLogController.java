package com.personal.workspace.controller;

import com.personal.workspace.dto.ActivityLogDTO;
import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.service.ActivityLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/activity")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ActivityLogDTO>>> getActivities(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<ActivityLogDTO> activities = activityLogService.getUserActivities(userId);
        return ResponseEntity.ok(ApiResponse.success("Activity logs retrieved successfully", activities));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<ActivityLogDTO>>> getProjectActivities(@PathVariable UUID projectId) {
        List<ActivityLogDTO> activities = activityLogService.getProjectActivities(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project activity logs retrieved successfully", activities));
    }
}
