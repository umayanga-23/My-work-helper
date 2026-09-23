package com.personal.workspace.controller;

import com.personal.workspace.dto.*;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AiChatRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        AiChatResponse response = aiService.chat(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/morning-briefing")
    public ResponseEntity<ApiResponse<MorningBriefingDTO>> getMorningBriefing(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        MorningBriefingDTO briefing = aiService.getMorningBriefing(userId);
        return ResponseEntity.ok(ApiResponse.success(briefing));
    }

    @PostMapping("/plan-today")
    public ResponseEntity<ApiResponse<TodayPlanDTO>> planToday(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        TodayPlanDTO plan = aiService.generateTodayPlan(userId);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }

    @PostMapping("/decompose-task/{taskId}")
    public ResponseEntity<ApiResponse<DecomposeResultDTO>> decomposeTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DecomposeResultDTO result = aiService.decomposeTask(userId, taskId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/execute-actions")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> executeActions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody List<AiActionItem> actions) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<TaskDTO> created = aiService.executeActions(userId, actions);
        return ResponseEntity.ok(ApiResponse.success("Actions executed successfully", created));
    }

    @PostMapping("/summarize-note/{noteId}")
    public ResponseEntity<ApiResponse<NoteSummaryDTO>> summarizeNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID noteId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        NoteSummaryDTO summary = aiService.summarizeNote(userId, noteId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PostMapping("/query-knowledge-base")
    public ResponseEntity<ApiResponse<KnowledgeQueryResponse>> queryKnowledgeBase(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody KnowledgeQueryRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        KnowledgeQueryResponse response = aiService.queryKnowledgeBase(userId, request != null ? request.getQuery() : "");
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/productivity-insights")
    public ResponseEntity<ApiResponse<ProductivityAnalyticsDTO>> getProductivityInsights(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProductivityAnalyticsDTO insights = aiService.getProductivityInsights(userId);
        return ResponseEntity.ok(ApiResponse.success(insights));
    }

    @PostMapping("/generate-project-prd/{projectId}")
    public ResponseEntity<ApiResponse<ProjectPrdDTO>> generateProjectPrd(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID projectId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectPrdDTO prd = aiService.generateProjectPrd(userId, projectId);
        return ResponseEntity.ok(ApiResponse.success(prd));
    }

    @PostMapping("/expand-idea/{ideaId}")
    public ResponseEntity<ApiResponse<IdeaExpansionDTO>> expandIdea(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID ideaId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        IdeaExpansionDTO dto = aiService.expandIdea(userId, ideaId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/convert-idea-to-project/{ideaId}")
    public ResponseEntity<ApiResponse<ProjectDTO>> convertIdeaToProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID ideaId) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        ProjectDTO project = aiService.convertIdeaToProject(userId, ideaId);
        return ResponseEntity.ok(ApiResponse.success("Idea successfully converted to Project with tasks", project));
    }

    @PostMapping("/chat-document")
    public ResponseEntity<ApiResponse<DocumentChatResponse>> chatDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody DocumentChatRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        DocumentChatResponse response = aiService.chatDocument(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/test-connection")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testConnection(
            @RequestBody(required = false) Map<String, String> body) {
        String apiKey = body != null ? body.get("apiKey") : null;
        String provider = body != null ? body.get("provider") : "GOOGLE_GEMINI";
        Map<String, Object> result = aiService.testConnection(apiKey, provider);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
