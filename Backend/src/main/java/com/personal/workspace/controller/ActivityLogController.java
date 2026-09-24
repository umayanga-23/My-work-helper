package com.personal.workspace.controller;

import com.personal.workspace.dto.ActivityLogDTO;
import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.ActivityLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/activity", "/api/activity-logs"})
public class ActivityLogController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ActivityLogDTO>>> getActivities(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<ActivityLogDTO> activities = activityLogService.getUserActivities(userId);
        return ResponseEntity.ok(ApiResponse.success("Activity logs retrieved successfully", activities));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<List<ActivityLogDTO>>> getProjectActivities(@PathVariable UUID projectId) {
        List<ActivityLogDTO> activities = activityLogService.getProjectActivities(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project activity logs retrieved successfully", activities));
    }
}
