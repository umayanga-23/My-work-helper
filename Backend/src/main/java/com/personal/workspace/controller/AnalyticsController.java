package com.personal.workspace.controller;

import com.personal.workspace.dto.AnalyticsSummaryDTO;
import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDTO>> getAnalyticsSummary(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        AnalyticsSummaryDTO summary = analyticsService.getAnalyticsSummary(userId);
        return ResponseEntity.ok(ApiResponse.success("Analytics summary retrieved successfully", summary));
    }
}
