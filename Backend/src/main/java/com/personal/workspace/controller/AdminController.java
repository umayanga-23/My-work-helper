package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.SupabaseStorageMetricsDTO;
import com.personal.workspace.dto.SystemMetricsDTO;
import com.personal.workspace.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<SystemMetricsDTO>> getSystemMetrics() {
        SystemMetricsDTO metrics = adminService.getSystemMetrics();
        return ResponseEntity.ok(ApiResponse.success("System metrics retrieved successfully", metrics));
    }

    @GetMapping("/supabase-space")
    public ResponseEntity<ApiResponse<SupabaseStorageMetricsDTO>> getSupabaseSpaceMetrics() {
        SupabaseStorageMetricsDTO spaceMetrics = adminService.getSupabaseStorageMetrics();
        return ResponseEntity.ok(ApiResponse.success("Supabase space metrics retrieved successfully", spaceMetrics));
    }
}
