package com.personal.workspace.controller;

import com.personal.workspace.dto.*;
import com.personal.workspace.entity.TopicStatus;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SkillDTO>>> getSkills(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<SkillDTO> skills = skillService.getSkills(userId);
        return ResponseEntity.ok(ApiResponse.success(skills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SkillDTO>> getSkillById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        SkillDTO skill = skillService.getSkillById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(skill));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SkillDTO>> createSkill(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SkillRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        SkillDTO created = skillService.createSkill(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Skill created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SkillDTO>> updateSkill(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody SkillRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        SkillDTO updated = skillService.updateSkill(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Skill updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        skillService.deleteSkill(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Skill deleted successfully", null));
    }

    @PostMapping("/{id}/topics")
    public ResponseEntity<ApiResponse<LearningTopicDTO>> createTopic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody LearningTopicRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        LearningTopicDTO topic = skillService.createTopic(userId, id, request);
        return new ResponseEntity<>(ApiResponse.success("Learning topic added", topic), HttpStatus.CREATED);
    }

    @PatchMapping("/topics/{topicId}/status")
    public ResponseEntity<ApiResponse<LearningTopicDTO>> updateTopicStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID topicId,
            @RequestParam TopicStatus status) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        LearningTopicDTO updated = skillService.updateTopicStatus(userId, topicId, status);
        return ResponseEntity.ok(ApiResponse.success("Topic status updated", updated));
    }

    @PutMapping("/topics/{topicId}/notes")
    public ResponseEntity<ApiResponse<LearningTopicDTO>> updateTopicNotes(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID topicId,
            @RequestBody Map<String, String> body) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        String notes = body.get("notes");
        String cheatsheet = body.get("cheatsheet");
        LearningTopicDTO updated = skillService.updateTopicNotes(userId, topicId, notes, cheatsheet);
        return ResponseEntity.ok(ApiResponse.success("Topic notes and cheatsheet saved", updated));
    }

    // --- Resources ---
    @PostMapping("/{id}/resources")
    public ResponseEntity<ApiResponse<LearningResourceDTO>> addResource(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody LearningResourceRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        LearningResourceDTO res = skillService.addResource(userId, id, request);
        return new ResponseEntity<>(ApiResponse.success("Resource attached successfully", res), HttpStatus.CREATED);
    }

    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID resourceId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        skillService.deleteResource(userId, resourceId);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully", null));
    }

    // --- Study Sessions & Analytics ---
    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<StudySessionDTO>> logStudySession(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StudySessionRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        StudySessionDTO session = skillService.logStudySession(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Study session logged", session), HttpStatus.CREATED);
    }

    @GetMapping("/study-stats")
    public ResponseEntity<ApiResponse<StudyStatsDTO>> getStudyStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        StudyStatsDTO stats = skillService.getStudyStats(userId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // --- Certificates ---
    @PostMapping("/{id}/certificates")
    public ResponseEntity<ApiResponse<SkillCertificateDTO>> addCertificate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody SkillCertificateRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        SkillCertificateDTO cert = skillService.addCertificate(userId, id, request);
        return new ResponseEntity<>(ApiResponse.success("Certificate added successfully", cert), HttpStatus.CREATED);
    }

    @DeleteMapping("/certificates/{certificateId}")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID certificateId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        skillService.deleteCertificate(userId, certificateId);
        return ResponseEntity.ok(ApiResponse.success("Certificate deleted successfully", null));
    }

    // --- Projects ---
    @PostMapping("/{id}/projects/{projectId}")
    public ResponseEntity<ApiResponse<SkillProjectDTO>> linkProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID projectId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        SkillProjectDTO linked = skillService.linkProjectToSkill(userId, id, projectId);
        return new ResponseEntity<>(ApiResponse.success("Project linked successfully", linked), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}/projects/{projectId}")
    public ResponseEntity<ApiResponse<Void>> unlinkProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID projectId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        skillService.unlinkProjectFromSkill(userId, id, projectId);
        return ResponseEntity.ok(ApiResponse.success("Project unlinked successfully", null));
    }
}
