package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.ClientInquiryRequest;
import com.personal.workspace.dto.DemoVisitorRequest;
import com.personal.workspace.entity.ClientInquiryEntity;
import com.personal.workspace.entity.DemoVisitorEntity;
import com.personal.workspace.service.TelemetryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostMapping("/api/analytics/demo-visitor")
    public ResponseEntity<ApiResponse<DemoVisitorEntity>> logDemoVisitor(
            @Valid @RequestBody DemoVisitorRequest request,
            HttpServletRequest servletRequest) {

        String ip = servletRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = servletRequest.getRemoteAddr();
        }

        String country = servletRequest.getHeader("CF-IPCountry"); // Cloudflare header if present

        DemoVisitorEntity saved = telemetryService.recordDemoVisitor(request, ip, country);
        return ResponseEntity.ok(ApiResponse.success("Demo visitor logged", saved));
    }

    @PostMapping("/api/inquiries")
    public ResponseEntity<ApiResponse<ClientInquiryEntity>> submitInquiry(
            @Valid @RequestBody ClientInquiryRequest request) {
        ClientInquiryEntity saved = telemetryService.submitInquiry(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Your request has been sent to Induwara! He will contact you soon.",
                saved
        ));
    }

    @GetMapping("/api/admin/demo-visitors")
    public ResponseEntity<ApiResponse<List<DemoVisitorEntity>>> getDemoVisitors() {
        List<DemoVisitorEntity> visitors = telemetryService.getAllVisitors();
        return ResponseEntity.ok(ApiResponse.success("Demo visitors retrieved", visitors));
    }

    @GetMapping("/api/admin/inquiries")
    public ResponseEntity<ApiResponse<List<ClientInquiryEntity>>> getInquiries() {
        List<ClientInquiryEntity> inquiries = telemetryService.getAllInquiries();
        return ResponseEntity.ok(ApiResponse.success("Inquiries retrieved", inquiries));
    }

    @PatchMapping("/api/admin/inquiries/{id}/status")
    public ResponseEntity<ApiResponse<ClientInquiryEntity>> updateInquiryStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String notes = payload.get("notes");
        ClientInquiryEntity updated = telemetryService.updateInquiryStatus(id, status, notes);
        return ResponseEntity.ok(ApiResponse.success("Inquiry status updated", updated));
    }
}
