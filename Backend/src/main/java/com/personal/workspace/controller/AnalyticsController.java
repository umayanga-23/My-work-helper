package com.personal.workspace.controller;

import com.personal.workspace.dto.AnalyticsSummaryDTO;
import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping({"/summary", "/dashboard"})
    public ResponseEntity<ApiResponse<AnalyticsSummaryDTO>> getAnalyticsSummary(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        AnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary(userId);
        return ResponseEntity.ok(ApiResponse.success("Analytics summary retrieved successfully", summary));
    }
}
