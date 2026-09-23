package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.DashboardCardDTO;
import com.personal.workspace.dto.DashboardCardRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.DashboardCardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard-cards")
public class DashboardCardController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final DashboardCardService dashboardCardService;

    public DashboardCardController(DashboardCardService dashboardCardService) {
        this.dashboardCardService = dashboardCardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DashboardCardDTO>>> getDashboardCards(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<DashboardCardDTO> cards = dashboardCardService.getDashboardCards(userId);
        return ResponseEntity.ok(ApiResponse.success(cards));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DashboardCardDTO>> createCard(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DashboardCardRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DashboardCardDTO created = dashboardCardService.createCard(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Custom card created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DashboardCardDTO>> updateCard(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody DashboardCardRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DashboardCardDTO updated = dashboardCardService.updateCard(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Custom card updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCard(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        dashboardCardService.deleteCard(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Custom card removed successfully", null));
    }
}
