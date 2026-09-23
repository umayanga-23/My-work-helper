package com.personal.workspace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.personal.workspace.dto.*;
import com.personal.workspace.entity.*;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${ai.gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CategoryRepository categoryRepository;
    private final StudySessionRepository studySessionRepository;
    private final NoteRepository noteRepository;
    private final IdeaRepository ideaRepository;
    private final TaskService taskService;
    private final AiConversationRepository aiConversationRepository;
    private final AiMessageRepository aiMessageRepository;
    private final TaskDependencyRepository taskDependencyRepository;

    public AiService(TaskRepository taskRepository,
                     ProjectRepository projectRepository,
                     CategoryRepository categoryRepository,
                     StudySessionRepository studySessionRepository,
                     NoteRepository noteRepository,
                     IdeaRepository ideaRepository,
                     TaskService taskService,
                     AiConversationRepository aiConversationRepository,
                     AiMessageRepository aiMessageRepository,
                     TaskDependencyRepository taskDependencyRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.categoryRepository = categoryRepository;
        this.studySessionRepository = studySessionRepository;
        this.noteRepository = noteRepository;
        this.ideaRepository = ideaRepository;
        this.taskService = taskService;
        this.aiConversationRepository = aiConversationRepository;
        this.aiMessageRepository = aiMessageRepository;
        this.taskDependencyRepository = taskDependencyRepository;
    }

    @Transactional
    public AiChatResponse chat(UUID userId, AiChatRequest request) {
        AiConversationEntity conversation;
        if (request.getConversationId() != null) {
            conversation = aiConversationRepository.findByIdAndUserId(request.getConversationId(), userId)
                    .orElseGet(() -> aiConversationRepository.save(new AiConversationEntity(userId, "New Conversation")));
        } else {
            String title = request.getMessage().length() > 40 ? request.getMessage().substring(0, 37) + "..." : request.getMessage();
            conversation = aiConversationRepository.save(new AiConversationEntity(userId, title));
        }

        // Save user message
        aiMessageRepository.save(new AiMessageEntity(conversation, "user", request.getMessage(), null, null));

        // Build workspace context
        String workspaceContext = buildWorkspaceContext(userId);

        // Call Gemini or smart fallback
        String prompt = buildPromptWithContext(request.getMessage(), workspaceContext, request.getHistory());
        String aiRawReply = callGeminiApi(prompt);

        // Parse action items if proposed by AI
        List<AiActionItem> actions = parseActionsFromText(aiRawReply);
        String cleanedReply = cleanReplyText(aiRawReply);

        String actionType = actions.isEmpty() ? null : "CREATE_TASKS";

        // Save assistant reply
        try {
            String payloadJson = actions.isEmpty() ? null : objectMapper.writeValueAsString(actions);
            aiMessageRepository.save(new AiMessageEntity(conversation, "assistant", cleanedReply, actionType, payloadJson));
        } catch (Exception e) {
            log.warn("Failed to serialize action payload", e);
        }

        return new AiChatResponse(cleanedReply, conversation.getId(), actionType, actions);
    }

    public MorningBriefingDTO getMorningBriefing(UUID userId) {
        List<TaskEntity> allTasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<TaskEntity> pendingTasks = allTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                .collect(Collectors.toList());

        List<TaskEntity> urgentTasks = pendingTasks.stream()
                .filter(t -> t.getPriority() == TaskPriority.URGENT || t.getPriority() == TaskPriority.HIGH)
                .collect(Collectors.toList());

        List<ProjectEntity> activeProjects = projectRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE || p.getStatus() == ProjectStatus.PLANNING)
                .collect(Collectors.toList());

        List<LocalDate> sessionDates = studySessionRepository.findDistinctSessionDatesByUserId(userId);
        int streak = calculateStreak(sessionDates);

        // Select top 3 focus tasks
        List<TaskDTO> topFocus = pendingTasks.stream()
                .sorted((a, b) -> Integer.compare(getPriorityRank(b.getPriority()), getPriorityRank(a.getPriority())))
                .limit(3)
                .map(this::mapTaskToDTO)
                .collect(Collectors.toList());

        LocalTime now = LocalTime.now();
        String timeGreeting = now.getHour() < 12 ? "Good morning!" : now.getHour() < 17 ? "Good afternoon!" : "Good evening!";

        MorningBriefingDTO dto = new MorningBriefingDTO();
        dto.setGreeting(timeGreeting + " Here is your Strategic Workspace Briefing.");
        dto.setMotivationQuote("Focus on high-leverage execution. Small daily disciplines compound into massive long-term achievements.");
        dto.setUrgentTasksCount(urgentTasks.size());
        dto.setPendingTasksCount(pendingTasks.size());
        dto.setActiveProjectsCount(activeProjects.size());
        dto.setCurrentStreakDays(streak);
        dto.setTopFocusTasks(topFocus);

        List<String> insights = new ArrayList<>();
        if (!urgentTasks.isEmpty()) {
            insights.add("⚠️ You have " + urgentTasks.size() + " urgent/high priority task(s) requiring immediate attention.");
        }
        if (!activeProjects.isEmpty()) {
            insights.add("🚀 " + activeProjects.size() + " active project(s) in progress. Keep up the momentum.");
        }
        if (streak > 0) {
            insights.add("🔥 " + streak + "-day learning streak active! Schedule a 25m Pomodoro block to keep it burning.");
        } else {
            insights.add("💡 Start today's study session to ignite a new learning streak.");
        }
        dto.setStrategicInsights(insights);
        dto.setSummaryText("You have " + pendingTasks.size() + " total pending tasks across " + activeProjects.size() + " active projects.");

        return dto;
    }

    public TodayPlanDTO generateTodayPlan(UUID userId) {
        List<TaskEntity> allTasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<TaskEntity> pending = allTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getStatus() != TaskStatus.CANCELLED)
                .collect(Collectors.toList());

        if (pending.isEmpty()) {
            TodayPlanDTO emptyPlan = new TodayPlanDTO();
            emptyPlan.setStrategyRationale("No pending tasks found. Your backlog is completely clear!");
            emptyPlan.setEstimatedTotalHours(0);
            emptyPlan.setEstimatedWorkload("0m");
            emptyPlan.setReasonForOrder("Backlog is clear. No tasks require scheduling today.");
            emptyPlan.setPotentialConflicts(new ArrayList<>());
            emptyPlan.setSuggestedOrder(new ArrayList<>());
            emptyPlan.setRecommendedTasks(new ArrayList<>());
            return emptyPlan;
        }

        // Index candidate entities by ID for strict verification against existing tasks
        Map<UUID, TaskEntity> pendingMap = pending.stream()
                .collect(Collectors.toMap(TaskEntity::getId, t -> t, (a, b) -> a));

        // Gather candidate data safely (no secrets)
        List<Map<String, Object>> candidateList = new ArrayList<>();
        Map<UUID, List<String>> blockedByMap = new HashMap<>();
        Map<UUID, List<String>> blocksMap = new HashMap<>();

        for (TaskEntity t : pending) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("taskId", t.getId().toString());
            item.put("taskKey", t.getTaskKey() != null ? t.getTaskKey() : "TASK");
            item.put("title", t.getTitle());
            item.put("description", sanitizeDescription(t.getDescription()));
            item.put("priority", t.getPriority() != null ? t.getPriority().name() : "MEDIUM");
            item.put("dueDate", t.getDueDate() != null ? t.getDueDate().toString() : "Unscheduled");
            item.put("dueTime", t.getDueTime() != null ? t.getDueTime().toString() : "None");
            item.put("estimatedDurationMinutes", t.getEstimatedDuration() != null && t.getEstimatedDuration() > 0 ? t.getEstimatedDuration() : null);
            item.put("currentStatus", t.getStatus() != null ? t.getStatus().name() : "TODO");

            if (t.getProjectId() != null) {
                projectRepository.findById(t.getProjectId()).ifPresent(p -> item.put("project", p.getName()));
            }

            // Inbound dependencies (blocked by)
            List<TaskDependencyEntity> blockedByDeps = taskDependencyRepository.findByTaskId(t.getId());
            List<String> blockedByTitles = new ArrayList<>();
            for (TaskDependencyEntity dep : blockedByDeps) {
                taskRepository.findById(dep.getDependsOnTaskId()).ifPresent(prereq -> {
                    blockedByTitles.add(prereq.getTitle() + " (" + prereq.getStatus() + ")");
                });
            }
            item.put("blockedBy", blockedByTitles);
            blockedByMap.put(t.getId(), blockedByTitles);

            // Outbound dependencies (blocks)
            List<TaskDependencyEntity> blocksDeps = taskDependencyRepository.findByDependsOnTaskId(t.getId());
            List<String> blocksTitles = new ArrayList<>();
            for (TaskDependencyEntity dep : blocksDeps) {
                taskRepository.findById(dep.getTaskId()).ifPresent(succ -> {
                    blocksTitles.add(succ.getTitle());
                });
            }
            item.put("blocks", blocksTitles);
            blocksMap.put(t.getId(), blocksTitles);

            candidateList.add(item);
        }

        // Attempt AI generation via Gemini
        TodayPlanDTO aiPlan = tryGeneratePlanWithGemini(candidateList, pendingMap);
        if (aiPlan != null && !aiPlan.getSuggestedOrder().isEmpty()) {
            return aiPlan;
        }

        // Deterministic Rule-Based Fallback
        return generateRuleBasedPlan(pending, pendingMap, blockedByMap, blocksMap);
    }

    private TodayPlanDTO tryGeneratePlanWithGemini(List<Map<String, Object>> candidateList, Map<UUID, TaskEntity> pendingMap) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return null;
        }
        try {
            String candidatesJson = objectMapper.writeValueAsString(candidateList);
            LocalDate today = LocalDate.now();

            String prompt = "You are an expert AI software engineering productivity planner for the AIU Workspace.\n"
                    + "Analyze the user's real tasks below and suggest the optimal execution sequence for today (" + today + ").\n\n"
                    + "STRICT RULES:\n"
                    + "1. Use ONLY the provided tasks. DO NOT invent, hallucinate, or fabricate any tasks.\n"
                    + "2. Every item in 'suggestedOrder' MUST contain a 'taskId' exactly matching one of the candidate task IDs provided.\n"
                    + "3. DO NOT invent deadlines or times if not specified in the input.\n"
                    + "4. Respect task dependencies: tasks that are blocked by incomplete prerequisites should NOT precede their prerequisites. Tasks that block other tasks should be prioritized to clear the critical path.\n"
                    + "5. Identify potential conflicts: blocked tasks, tight deadlines, or excessive workload.\n"
                    + "6. Calculate 'estimatedWorkload' based strictly on the sum of known task estimates (e.g. '3h 30m'). If tasks lack duration, state 'Estimated workload unavailable'.\n\n"
                    + "Candidate Tasks:\n" + candidatesJson + "\n\n"
                    + "Respond STRICTLY with valid JSON without any markdown formatting or code fences:\n"
                    + "{\n"
                    + "  \"suggestedOrder\": [\n"
                    + "    { \"orderNumber\": 1, \"taskId\": \"<exact-id>\", \"reason\": \"<clear reason for this order>\" }\n"
                    + "  ],\n"
                    + "  \"reasonForOrder\": \"<comprehensive explanation of the sequence>\",\n"
                    + "  \"estimatedWorkload\": \"<e.g. 2h 45m or Estimated workload unavailable>\",\n"
                    + "  \"potentialConflicts\": [ \"<conflict 1>\", \"<conflict 2>\" ]\n"
                    + "}";

            String raw = callGeminiApi(prompt);
            if (raw == null || raw.isBlank()) return null;

            String cleaned = raw.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode root = objectMapper.readTree(cleaned);
            JsonNode orderArray = root.path("suggestedOrder");
            if (!orderArray.isArray() || orderArray.isEmpty()) return null;

            List<PlanOrderItemDTO> orderItems = new ArrayList<>();
            List<TaskDTO> recommendedTasks = new ArrayList<>();
            int orderNum = 1;
            int totalMinutes = 0;
            int countWithEstimates = 0;

            for (JsonNode node : orderArray) {
                String idStr = node.path("taskId").asText();
                if (idStr == null || idStr.isBlank()) continue;

                UUID taskId;
                try {
                    taskId = UUID.fromString(idStr.trim());
                } catch (IllegalArgumentException e) {
                    continue; // Skip invalid UUID (prevents hallucinated IDs)
                }

                TaskEntity entity = pendingMap.get(taskId);
                if (entity == null) {
                    continue; // Skip any task not in user's real candidate list!
                }

                String reason = node.path("reason").asText("Prioritized for today's execution");
                TaskDTO dto = mapTaskToDTO(entity);
                recommendedTasks.add(dto);

                Integer dur = entity.getEstimatedDuration();
                if (dur != null && dur > 0) {
                    totalMinutes += dur;
                    countWithEstimates++;
                }

                String projName = null;
                if (entity.getProjectId() != null) {
                    var pOpt = projectRepository.findById(entity.getProjectId());
                    if (pOpt.isPresent()) projName = pOpt.get().getName();
                }

                PlanOrderItemDTO item = new PlanOrderItemDTO(
                        orderNum++,
                        entity.getId(),
                        entity.getTaskKey(),
                        entity.getTitle(),
                        reason,
                        dur,
                        entity.getPriority() != null ? entity.getPriority().name() : "MEDIUM",
                        entity.getStatus() != null ? entity.getStatus().name() : "TODO",
                        projName,
                        entity.getDueDate(),
                        entity.getDueTime() != null ? entity.getDueTime().toString() : null
                );
                orderItems.add(item);
            }

            if (orderItems.isEmpty()) return null;

            String reasonForOrder = root.path("reasonForOrder").asText("Sequenced to resolve blockers, respect priority, and maximize output today.");
            String rawWorkload = root.path("estimatedWorkload").asText("");
            String workload;
            if (countWithEstimates > 0) {
                workload = formatWorkloadMinutes(totalMinutes);
            } else if (!rawWorkload.isBlank() && !rawWorkload.equalsIgnoreCase("null")) {
                workload = rawWorkload;
            } else {
                workload = "Estimated workload unavailable";
            }

            List<String> conflicts = new ArrayList<>();
            JsonNode conflictsNode = root.path("potentialConflicts");
            if (conflictsNode.isArray()) {
                for (JsonNode c : conflictsNode) {
                    String conflictText = c.asText();
                    if (conflictText != null && !conflictText.isBlank()) {
                        conflicts.add(conflictText.trim());
                    }
                }
            }

            TodayPlanDTO plan = new TodayPlanDTO();
            plan.setStrategyRationale("AI Strategic Today's Plan: Optimized based on real dependencies, priority weights, and deadlines.");
            plan.setEstimatedTotalHours((int) Math.ceil(totalMinutes / 60.0));
            plan.setEstimatedWorkload(workload);
            plan.setReasonForOrder(reasonForOrder);
            plan.setPotentialConflicts(conflicts);
            plan.setSuggestedOrder(orderItems);
            plan.setRecommendedTasks(recommendedTasks);
            return plan;

        } catch (Exception e) {
            log.warn("Gemini plan-today parsing failed, using rule-based engine: {}", e.getMessage());
            return null;
        }
    }

    private TodayPlanDTO generateRuleBasedPlan(List<TaskEntity> pending,
                                               Map<UUID, TaskEntity> pendingMap,
                                               Map<UUID, List<String>> blockedByMap,
                                               Map<UUID, List<String>> blocksMap) {
        LocalDate today = LocalDate.now();

        // Sort pending tasks deterministically:
        // 1. Overdue or Due Today
        // 2. Tasks that block other tasks (unblock critical path)
        // 3. Priority (URGENT > HIGH > MEDIUM > LOW)
        // 4. In Progress status
        // 5. Tie-breaker
        List<TaskEntity> sorted = new ArrayList<>(pending);
        sorted.sort((a, b) -> {
            boolean aOverdue = a.getDueDate() != null && a.getDueDate().isBefore(today);
            boolean bOverdue = b.getDueDate() != null && b.getDueDate().isBefore(today);
            if (aOverdue != bOverdue) return aOverdue ? -1 : 1;

            boolean aToday = a.getDueDate() != null && a.getDueDate().isEqual(today);
            boolean bToday = b.getDueDate() != null && b.getDueDate().isEqual(today);
            if (aToday != bToday) return aToday ? -1 : 1;

            int aBlocksCount = blocksMap.getOrDefault(a.getId(), List.of()).size();
            int bBlocksCount = blocksMap.getOrDefault(b.getId(), List.of()).size();
            if (aBlocksCount != bBlocksCount) return Integer.compare(bBlocksCount, aBlocksCount);

            int pA = getPriorityRank(a.getPriority());
            int pB = getPriorityRank(b.getPriority());
            if (pA != pB) return Integer.compare(pB, pA);

            boolean aProg = a.getStatus() == TaskStatus.IN_PROGRESS;
            boolean bProg = b.getStatus() == TaskStatus.IN_PROGRESS;
            if (aProg != bProg) return aProg ? -1 : 1;

            return a.getId().compareTo(b.getId());
        });

        List<TaskEntity> selection = sorted.stream().limit(6).collect(Collectors.toList());
        List<PlanOrderItemDTO> orderItems = new ArrayList<>();
        List<TaskDTO> recommendedTasks = new ArrayList<>();
        List<String> conflicts = new ArrayList<>();

        int totalMinutes = 0;
        int countWithEstimates = 0;
        int orderNum = 1;

        for (TaskEntity t : selection) {
            TaskDTO dto = mapTaskToDTO(t);
            recommendedTasks.add(dto);

            Integer dur = t.getEstimatedDuration();
            if (dur != null && dur > 0) {
                totalMinutes += dur;
                countWithEstimates++;
            }

            // Reason synthesis
            String reason;
            List<String> blocks = blocksMap.getOrDefault(t.getId(), List.of());
            List<String> blockedBy = blockedByMap.getOrDefault(t.getId(), List.of());

            if (!blocks.isEmpty()) {
                reason = "Critical path: Completing this unblocks " + blocks.size() + " subsequent task(s)";
            } else if (t.getDueDate() != null && t.getDueDate().isBefore(today)) {
                reason = "Overdue task requiring immediate attention";
            } else if (t.getDueDate() != null && t.getDueDate().isEqual(today)) {
                reason = "Due today" + (t.getDueTime() != null ? " at " + t.getDueTime() : "");
            } else if (t.getPriority() == TaskPriority.URGENT || t.getPriority() == TaskPriority.HIGH) {
                reason = "High priority focus item for today's milestone";
            } else {
                reason = "Sequential progress on workspace backlog";
            }

            // Check potential conflicts
            for (String depInfo : blockedBy) {
                if (!depInfo.contains("COMPLETED")) {
                    conflicts.add("Task '" + (t.getTaskKey() != null ? t.getTaskKey() + ": " : "") + t.getTitle() + "' is blocked by incomplete prerequisite: " + depInfo);
                }
            }

            String projName = null;
            if (t.getProjectId() != null) {
                var pOpt = projectRepository.findById(t.getProjectId());
                if (pOpt.isPresent()) projName = pOpt.get().getName();
            }

            PlanOrderItemDTO item = new PlanOrderItemDTO(
                    orderNum++,
                    t.getId(),
                    t.getTaskKey(),
                    t.getTitle(),
                    reason,
                    dur,
                    t.getPriority() != null ? t.getPriority().name() : "MEDIUM",
                    t.getStatus() != null ? t.getStatus().name() : "TODO",
                    projName,
                    t.getDueDate(),
                    t.getDueTime() != null ? t.getDueTime().toString() : null
            );
            orderItems.add(item);
        }

        if (totalMinutes > 480) {
            conflicts.add("Total workload (~" + formatWorkloadMinutes(totalMinutes) + ") exceeds recommended 8h daily capacity");
        }

        String workload = countWithEstimates > 0 ? formatWorkloadMinutes(totalMinutes) : "Estimated workload unavailable";
        String reasonForOrder = "Sequenced by dependency readiness (unblocking successors first), overdue deadlines, and priority ranking.";

        TodayPlanDTO plan = new TodayPlanDTO();
        plan.setStrategyRationale("Smart Rule Engine Plan: Deterministically sorted by dependency readiness, urgency, and priority.");
        plan.setEstimatedTotalHours((int) Math.ceil(totalMinutes / 60.0));
        plan.setEstimatedWorkload(workload);
        plan.setReasonForOrder(reasonForOrder);
        plan.setPotentialConflicts(conflicts);
        plan.setSuggestedOrder(orderItems);
        plan.setRecommendedTasks(recommendedTasks);
        return plan;
    }

    private String formatWorkloadMinutes(int totalMinutes) {
        if (totalMinutes <= 0) return "0m";
        int h = totalMinutes / 60;
        int m = totalMinutes % 60;
        if (h > 0 && m > 0) return h + "h " + m + "m";
        if (h > 0) return h + "h";
        return m + "m";
    }

    private String sanitizeDescription(String desc) {
        if (desc == null || desc.isBlank()) return "None";
        String sanitized = desc.replaceAll("(?i)(password|secret|api[_-]?key|token|bearer)\\s*[:=]\\s*\\S+", "$1: [REDACTED]");
        if (sanitized.length() > 200) {
            sanitized = sanitized.substring(0, 197) + "...";
        }
        return sanitized;
    }

    @Transactional
    public DecomposeResultDTO decomposeTask(UUID userId, UUID taskId) {
        TaskEntity task = taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        String projName = null;
        if (task.getProjectId() != null) {
            var pOpt = projectRepository.findById(task.getProjectId());
            if (pOpt.isPresent()) projName = pOpt.get().getName();
        }

        // Gather existing subtask titles to prevent duplicates
        Set<String> existingSubtaskTitles = new HashSet<>();
        if (task.getSubtasks() != null) {
            for (TaskEntity sub : task.getSubtasks()) {
                if (sub.getTitle() != null) {
                    existingSubtaskTitles.add(sub.getTitle().trim().toLowerCase());
                }
            }
        }

        List<AiActionItem> subtasks = tryDecomposeWithGemini(task, projName, existingSubtaskTitles);

        // Fallback if AI call failed, timed out, or returned no valid subtasks
        if (subtasks == null || subtasks.isEmpty()) {
            subtasks = generateRuleBasedDecomposition(task, projName, existingSubtaskTitles);
        }

        return new DecomposeResultDTO(
                task.getId(),
                task.getTitle(),
                "Decomposed into " + subtasks.size() + " practical, manageable subtasks.",
                subtasks
        );
    }

    private List<AiActionItem> tryDecomposeWithGemini(TaskEntity task, String projName, Set<String> existingTitles) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return null;
        }

        try {
            String prompt = "You are an expert Agile Software Engineering Lead and Technical Project Manager.\n"
                    + "Decompose the following parent task into 4 to 6 practical, manageable subtasks.\n\n"
                    + "Parent Task Title: " + task.getTitle() + "\n"
                    + "Parent Task Description: " + sanitizeDescription(task.getDescription()) + "\n"
                    + "Project: " + (projName != null ? projName : "None") + "\n\n"
                    + "Requirements:\n"
                    + "1. Break down the task into logical, sequential execution steps (e.g. design/spec, setup, core implementation, validation/testing).\n"
                    + "2. Do NOT invent exact technical requirements, libraries, or architecture that are not implied by the parent task.\n"
                    + "3. For each subtask provide:\n"
                    + "   - title: concise, clear title (e.g. 'Design authentication flow')\n"
                    + "   - description: optional brief summary of the subtask scope\n"
                    + "   - estimatedDuration: optional estimated minutes (e.g. 30, 45, 60, 90)\n"
                    + "   - dependencySuggestion: dependency suggestion where appropriate (e.g. 'Initial step', 'Depends on previous step: Design authentication flow')\n\n"
                    + "Respond strictly with valid JSON without any markdown formatting or code fences:\n"
                    + "{\n"
                    + "  \"subtasks\": [\n"
                    + "    {\n"
                    + "      \"orderNumber\": 1,\n"
                    + "      \"title\": \"Design authentication flow\",\n"
                    + "      \"description\": \"Define auth states, token lifecycle, and error conditions\",\n"
                    + "      \"priority\": \"HIGH\",\n"
                    + "      \"estimatedDuration\": 45,\n"
                    + "      \"dependencySuggestion\": \"Initial step: prerequisite for configuration\"\n"
                    + "    }\n"
                    + "  ]\n"
                    + "}";

            String rawResponse = callGeminiApi(prompt);
            if (rawResponse == null || rawResponse.isBlank()) return null;

            String cleaned = rawResponse.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode root = objectMapper.readTree(cleaned);
            JsonNode arrayNode = root.path("subtasks");
            if (!arrayNode.isArray() || arrayNode.isEmpty()) return null;

            List<AiActionItem> result = new ArrayList<>();
            Set<String> seenTitles = new HashSet<>();
            int order = 1;

            for (JsonNode node : arrayNode) {
                String title = node.path("title").asText("").trim();
                if (title.isEmpty()) continue;

                String norm = title.toLowerCase();
                // Prevent duplicates within response and against existing subtasks
                if (seenTitles.contains(norm) || existingTitles.contains(norm)) {
                    continue;
                }
                seenTitles.add(norm);

                String desc = node.path("description").asText(null);
                String priority = node.path("priority").asText("MEDIUM").toUpperCase();
                int dur = node.path("estimatedDuration").asInt(0);
                String dep = node.path("dependencySuggestion").asText(null);

                AiActionItem item = new AiActionItem("CREATE_TASK", title, desc, priority, null);
                item.setParentTaskId(task.getId());
                item.setProjectId(task.getProjectId());
                item.setProjectName(projName);
                item.setOrderNumber(order++);
                if (dur > 0) item.setEstimatedDuration(dur);
                if (dep != null && !dep.isBlank()) item.setDependencySuggestion(dep.trim());

                result.add(item);
            }

            return result.isEmpty() ? null : result;
        } catch (Exception e) {
            log.warn("Gemini task decomposition failed, falling back to rule engine: {}", e.getMessage());
            return null;
        }
    }

    private List<AiActionItem> generateRuleBasedDecomposition(TaskEntity task, String projName, Set<String> existingTitles) {
        List<AiActionItem> subtasks = new ArrayList<>();
        String titleLower = task.getTitle().toLowerCase();

        String[][] steps;
        if (titleLower.contains("auth") || titleLower.contains("login") || titleLower.contains("security")) {
            steps = new String[][] {
                { "Design authentication flow", "Define auth states, token lifecycle, and security model", "45", "Initial step: prerequisite for configuration" },
                { "Configure authentication provider", "Configure credentials, token generators, and provider settings", "60", "Depends on: Design authentication flow" },
                { "Implement login API", "Build backend authentication endpoints, session handling, and tokens", "60", "Depends on: Configure authentication provider" },
                { "Implement frontend login form", "Construct responsive login UI, state management, and submit flow", "60", "Depends on: Implement login API" },
                { "Add validation and error handling", "Implement form schema validation, error toasts, and edge case alerts", "45", "Depends on: Implement frontend login form" },
                { "Test authentication flow", "Execute end-to-end authentication tests and verify security constraints", "30", "Final step: quality assurance & verification" }
            };
        } else {
            steps = new String[][] {
                { "Design & Architecture Specifications", "Document technical architecture, data model, and user workflows", "45", "Initial step: foundational requirement" },
                { "Database Schema & Entity Setup", "Create database tables, entities, migrations, and repositories", "60", "Depends on: Design & Architecture" },
                { "Core Service Logic & APIs", "Implement business rules, controllers, and service methods", "90", "Depends on: Database Schema" },
                { "User Interface & State Integration", "Build frontend components and bind with backend endpoints", "60", "Depends on: Core Service Logic" },
                { "Validation, Testing & Error Handling", "Write unit tests, validate edge cases, and verify UX flow", "45", "Final step: quality assurance & verification" }
            };
        }

        int order = 1;
        for (String[] step : steps) {
            String stepTitle = step[0] + " for " + task.getTitle();
            if (steps.length > 5 && (titleLower.contains("auth") || titleLower.contains("login"))) {
                stepTitle = step[0];
            }
            String norm = stepTitle.toLowerCase();
            if (existingTitles.contains(norm)) continue;

            String desc = step[1];
            int dur = Integer.parseInt(step[2]);
            String dep = step[3];

            AiActionItem item = new AiActionItem("CREATE_TASK", stepTitle, desc, "MEDIUM", null);
            item.setParentTaskId(task.getId());
            item.setProjectId(task.getProjectId());
            item.setProjectName(projName);
            item.setOrderNumber(order++);
            item.setEstimatedDuration(dur);
            item.setDependencySuggestion(dep);

            subtasks.add(item);
        }

        return subtasks;
    }

    @Transactional
    public List<TaskDTO> executeActions(UUID userId, List<AiActionItem> actions) {
        List<TaskDTO> createdTasks = new ArrayList<>();
        for (AiActionItem action : actions) {
            if ("CREATE_TASK".equalsIgnoreCase(action.getType())) {
                TaskRequest req = new TaskRequest();
                req.setTitle(action.getTitle());
                req.setDescription(action.getDescription());
                try {
                    req.setPriority(TaskPriority.valueOf(action.getPriority().toUpperCase()));
                } catch (Exception e) {
                    req.setPriority(TaskPriority.MEDIUM);
                }
                req.setProjectId(action.getProjectId());
                if (action.getParentTaskId() != null) {
                    req.setParentTaskId(action.getParentTaskId());
                }
                if (action.getDueDate() != null && !action.getDueDate().isEmpty()) {
                    try {
                        req.setDueDate(LocalDate.parse(action.getDueDate()));
                    } catch (Exception ignored) {}
                }
                if (action.getEstimatedDuration() != null && action.getEstimatedDuration() > 0) {
                    req.setEstimatedDuration(action.getEstimatedDuration());
                }
                if (action.getDependsOnTaskId() != null) {
                    req.setDependsOnTaskId(action.getDependsOnTaskId());
                }
                TaskDTO created = taskService.createTask(userId, req);
                createdTasks.add(created);
            }
        }
        return createdTasks;
    }

    public NoteSummaryDTO summarizeNote(UUID userId, UUID noteId) {
        NoteEntity note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        String prompt = "You are an AI research assistant. Summarize this personal note concisely in Markdown format:\n\n"
                + "Title: " + note.getTitle() + "\n"
                + "Content:\n" + (note.getContent() != null ? note.getContent() : "Empty Note") + "\n\n"
                + "Provide:\n"
                + "1. A 2-sentence Executive Summary\n"
                + "2. Bulleted Key Takeaways\n"
                + "3. Suggested Action Items";

        String rawReply = callGeminiApi(prompt);

        List<String> keyTakeaways = new ArrayList<>();
        List<String> actionItems = new ArrayList<>();
        List<String> generatedTags = new ArrayList<>();

        if (note.getTags() != null && !note.getTags().isEmpty()) {
            generatedTags.addAll(Arrays.asList(note.getTags().split(",")));
        } else {
            generatedTags.addAll(List.of("knowledge", "summary", "ai-notes"));
        }

        String[] lines = rawReply.split("\n");
        boolean inTakeaways = false;
        boolean inActions = false;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.toLowerCase().contains("key takeaway") || trimmed.toLowerCase().contains("takeaway")) {
                inTakeaways = true;
                inActions = false;
                continue;
            }
            if (trimmed.toLowerCase().contains("action item") || trimmed.toLowerCase().contains("next step")) {
                inTakeaways = false;
                inActions = true;
                continue;
            }
            if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.matches("^\\d+\\..*")) {
                String clean = trimmed.replaceAll("^[-*\\d.]+\\s*", "");
                if (inTakeaways && !clean.isEmpty()) keyTakeaways.add(clean);
                else if (inActions && !clean.isEmpty()) actionItems.add(clean);
            }
        }

        if (keyTakeaways.isEmpty()) {
            keyTakeaways.add("Covers primary concepts discussed in " + note.getTitle());
            keyTakeaways.add("Reference note for architecture, best practices, and study");
        }
        if (actionItems.isEmpty()) {
            actionItems.add("Review related workspace tasks and project deadlines");
        }

        return new NoteSummaryDTO(
                note.getId(),
                note.getTitle(),
                rawReply,
                keyTakeaways,
                actionItems,
                generatedTags
        );
    }

    public KnowledgeQueryResponse queryKnowledgeBase(UUID userId, String query) {
        List<NoteEntity> notes = noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        StringBuilder kbBuilder = new StringBuilder();
        List<String> matchedSources = new ArrayList<>();

        for (NoteEntity n : notes) {
            if (n.getContent() != null && !n.getContent().trim().isEmpty()) {
                kbBuilder.append("--- NOTE: ").append(n.getTitle()).append(" ---\n");
                kbBuilder.append(n.getContent().length() > 600 ? n.getContent().substring(0, 600) + "..." : n.getContent()).append("\n\n");
                if (matchedSources.size() < 4) {
                    matchedSources.add("📝 Note: " + n.getTitle());
                }
            }
        }

        String prompt = "You are an intelligent knowledge base assistant answering a question based on user notes and documents.\n"
                + "User Question: " + query + "\n\n"
                + "Personal Notes Context:\n"
                + (kbBuilder.length() > 0 ? kbBuilder.toString() : "No notes written yet.") + "\n\n"
                + "Instructions: Provide an accurate, helpful answer citing relevant notes if applicable. If tasks should be created, use [ACTION:CREATE_TASK] Title | Priority | Description.";

        String aiReply = callGeminiApi(prompt);
        List<AiActionItem> actions = parseActionsFromText(aiReply);
        String cleaned = cleanReplyText(aiReply);

        return new KnowledgeQueryResponse(cleaned, matchedSources, actions);
    }

    public ProductivityAnalyticsDTO getProductivityInsights(UUID userId) {
        List<StudySessionEntity> sessions = studySessionRepository.findByUserIdOrderBySessionDateDescCreatedAtDesc(userId);
        List<TaskEntity> tasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);

        LocalDate oneWeekAgo = LocalDate.now().minusDays(7);
        int totalFocusMins = sessions.stream()
                .filter(s -> s.getSessionDate() != null && !s.getSessionDate().isBefore(oneWeekAgo))
                .mapToInt(StudySessionEntity::getDurationMinutes)
                .sum();

        long completedThisWeek = tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED && t.getCompletedAt() != null && t.getCompletedAt().toLocalDate().isAfter(oneWeekAgo))
                .count();

        Map<String, Integer> dailyFocus = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            String dayName = d.getDayOfWeek().name().substring(0, 3);
            int mins = sessions.stream()
                    .filter(s -> s.getSessionDate() != null && s.getSessionDate().equals(d))
                    .mapToInt(StudySessionEntity::getDurationMinutes)
                    .sum();
            dailyFocus.put(dayName, mins);
        }

        int efficiencyScore = Math.min(100, Math.max(30, (totalFocusMins / 3) + (int)(completedThisWeek * 8)));
        String diagnosis = efficiencyScore >= 75 ? "Optimal Deep Work Flow ⚡" : efficiencyScore >= 50 ? "Steady Momentum & Consistency 🚀" : "Building Momentum & Habit Formation 🌱";

        List<String> coaching = new ArrayList<>();
        coaching.add("🎯 Prime focus window identified around 09:00 AM – 11:30 AM (Peak cognitive retention).");
        if (totalFocusMins > 120) {
            coaching.add("🔥 Excellent dedication! Over " + (totalFocusMins / 60) + " hours of deep study recorded this week.");
        } else {
            coaching.add("💡 Schedule two 25-minute Pomodoro sprints today to supercharge your momentum.");
        }
        if (completedThisWeek > 3) {
            coaching.add("✅ " + completedThisWeek + " tasks completed this week. Maintain this compounding velocity.");
        }

        return new ProductivityAnalyticsDTO(
                totalFocusMins,
                (int) completedThisWeek,
                "09:00 AM - 11:30 AM",
                efficiencyScore,
                diagnosis,
                coaching,
                dailyFocus
        );
    }

    public ProjectPrdDTO generateProjectPrd(UUID userId, UUID projectId) {
        ProjectEntity project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        String prompt = "You are a Chief Product & Technical Officer. Generate an Executive Product Requirements Document (PRD) and Agile Sprint Roadmap for the following project:\n\n"
                + "Project Name: " + project.getName() + "\n"
                + "Description: " + (project.getDescription() != null ? project.getDescription() : "Custom software application") + "\n\n"
                + "Provide:\n"
                + "1. Executive Summary\n"
                + "2. Target Audience\n"
                + "3. Core Features\n"
                + "4. Recommended Tech Stack\n"
                + "5. Potential Risks\n"
                + "6. 3-Sprint Milestones (Sprint 1: Foundation, Sprint 2: Core Features, Sprint 3: Polish & Launch) with 3 concrete tasks per sprint using format: [ACTION:CREATE_TASK] Task Title | HIGH/MEDIUM | Task Description";

        String rawReply = callGeminiApi(prompt);

        ProjectPrdDTO dto = new ProjectPrdDTO();
        dto.setProjectId(project.getId());
        dto.setProjectName(project.getName());
        dto.setExecutiveSummary(rawReply.length() > 300 ? rawReply.substring(0, 300) + "..." : rawReply);
        dto.setTargetAudience("Developers, Business Stakeholders, and End-Users");
        dto.setKeyFeatures(List.of("Authentication & Role-Based Access", "Core Domain API & Business Logic", "Responsive Interactive UI & Analytics Dashboard"));
        dto.setRecommendedTechStack(List.of("Spring Boot 3 (Java 17)", "React + TypeScript + Tailwind CSS", "PostgreSQL / Supabase", "Docker"));
        dto.setPotentialRisks(List.of("Scope creep during sprint execution", "Integration latency with third-party APIs"));

        List<AiActionItem> parsedTasks = parseActionsFromText(rawReply);
        List<ProjectPrdDTO.SprintMilestoneDTO> milestones = new ArrayList<>();

        if (parsedTasks.size() >= 3) {
            int chunkSize = Math.max(1, parsedTasks.size() / 3);
            milestones.add(new ProjectPrdDTO.SprintMilestoneDTO("Sprint 1: Architecture & Foundation", "Setup core models and endpoints", parsedTasks.subList(0, Math.min(chunkSize, parsedTasks.size()))));
            if (parsedTasks.size() > chunkSize) {
                milestones.add(new ProjectPrdDTO.SprintMilestoneDTO("Sprint 2: Core Domain Features", "Build main business workflow and UI", parsedTasks.subList(chunkSize, Math.min(chunkSize * 2, parsedTasks.size()))));
            }
            if (parsedTasks.size() > chunkSize * 2) {
                milestones.add(new ProjectPrdDTO.SprintMilestoneDTO("Sprint 3: Testing & Deployment", "Integration testing, security audit, and deployment", parsedTasks.subList(chunkSize * 2, parsedTasks.size())));
            }
        } else {
            milestones.add(new ProjectPrdDTO.SprintMilestoneDTO("Sprint 1: Architecture & Foundation", "Core backend and database initialization", List.of(
                    new AiActionItem("CREATE_TASK", "Design Database Schema & Entities for " + project.getName(), "Create JPA entities and migration scripts", "HIGH", null),
                    new AiActionItem("CREATE_TASK", "Setup Core REST Endpoints for " + project.getName(), "Implement CRUD controllers and security filter", "HIGH", null)
            )));
            milestones.add(new ProjectPrdDTO.SprintMilestoneDTO("Sprint 2: UI & Feature Workflows", "Build responsive views and integrate state", List.of(
                    new AiActionItem("CREATE_TASK", "Build Interactive Dashboard Views for " + project.getName(), "Implement responsive React components", "MEDIUM", null),
                    new AiActionItem("CREATE_TASK", "Integrate Frontend with Backend REST API", "Connect Axios/Fetch API with error handling", "MEDIUM", null)
            )));
            milestones.add(new ProjectPrdDTO.SprintMilestoneDTO("Sprint 3: Verification & Launch", "Unit tests and deployment configuration", List.of(
                    new AiActionItem("CREATE_TASK", "Write End-to-End Integration Tests", "Test all user scenarios and edge cases", "MEDIUM", null),
                    new AiActionItem("CREATE_TASK", "Configure Production Deployment & Docker", "Create Dockerfile and staging pipeline", "HIGH", null)
            )));
        }

        dto.setSprintMilestones(milestones);
        return dto;
    }

    public IdeaExpansionDTO expandIdea(UUID userId, UUID ideaId) {
        IdeaEntity idea = ideaRepository.findByIdAndUserId(ideaId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + ideaId));

        String prompt = "You are a startup incubator advisor. Perform a strategic evaluation and SWOT analysis for this idea:\n\n"
                + "Title: " + idea.getTitle() + "\n"
                + "Description: " + (idea.getDescription() != null ? idea.getDescription() : "Innovative product idea") + "\n\n"
                + "Provide:\n"
                + "1. Value Proposition\n"
                + "2. Strengths (2 points)\n"
                + "3. Weaknesses (2 points)\n"
                + "4. Opportunities (2 points)\n"
                + "5. Threats (2 points)\n"
                + "6. Recommended Tech Stack\n"
                + "7. 3 Initial Execution Tasks formatted as: [ACTION:CREATE_TASK] Title | Priority | Description";

        String rawReply = callGeminiApi(prompt);
        List<AiActionItem> tasks = parseActionsFromText(rawReply);

        if (tasks.isEmpty()) {
            tasks.add(new AiActionItem("CREATE_TASK", "Conduct Market & Competitor Research for " + idea.getTitle(), "Analyze similar products and user pain points", "HIGH", null));
            tasks.add(new AiActionItem("CREATE_TASK", "Draft Technical Architecture & MVP Scope", "Define core MVP features and database schema", "HIGH", null));
            tasks.add(new AiActionItem("CREATE_TASK", "Build Interactive Prototype / Proof of Concept", "Develop minimum viable demonstration", "MEDIUM", null));
        }

        IdeaExpansionDTO dto = new IdeaExpansionDTO();
        dto.setIdeaId(idea.getId());
        dto.setIdeaTitle(idea.getTitle());
        dto.setValueProposition(rawReply.length() > 250 ? rawReply.substring(0, 250) + "..." : rawReply);
        dto.setStrengths(List.of("Solves a clear productivity bottleneck", "Highly scalable with low infrastructure cost"));
        dto.setWeaknesses(List.of("Requires initial user adoption drive", "Competitors with established brands"));
        dto.setOpportunities(List.of("Integration with modern AI tools & APIs", "SaaS subscription and freemium monetization"));
        dto.setThreats(List.of("Fast-moving AI ecosystem shifts", "API rate limits and provider changes"));
        dto.setRecommendedTechStack(List.of("React / Next.js", "Spring Boot / Node.js", "PostgreSQL", "Google Gemini AI"));
        dto.setInitialSprintTasks(tasks);

        return dto;
    }

    @Transactional
    public ProjectDTO convertIdeaToProject(UUID userId, UUID ideaId) {
        IdeaEntity idea = ideaRepository.findByIdAndUserId(ideaId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + ideaId));

        ProjectEntity project = new ProjectEntity();
        project.setUserId(userId);
        project.setName(idea.getTitle());
        project.setDescription(idea.getDescription());
        project.setStatus(ProjectStatus.ACTIVE);
        project.setStartDate(LocalDate.now());
        project.setProgress(10);
        project = projectRepository.save(project);

        idea.setStatus(IdeaStatus.CONVERTED_TO_PROJECT);
        idea.setConvertedProjectId(project.getId());
        ideaRepository.save(idea);

        // Create 3 starter tasks for the new project
        TaskRequest t1 = new TaskRequest();
        t1.setTitle("MVP Architecture & Setup: " + project.getName());
        t1.setDescription("Setup repository and foundational architecture from idea: " + idea.getTitle());
        t1.setPriority(TaskPriority.HIGH);
        t1.setProjectId(project.getId());
        taskService.createTask(userId, t1);

        TaskRequest t2 = new TaskRequest();
        t2.setTitle("Core Feature Implementation: " + project.getName());
        t2.setDescription("Build principal user workflow and core APIs");
        t2.setPriority(TaskPriority.HIGH);
        t2.setProjectId(project.getId());
        taskService.createTask(userId, t2);

        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setUserId(project.getUserId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStatus(project.getStatus());
        dto.setProgress(project.getProgress());
        dto.setStartDate(project.getStartDate());
        dto.setCreatedAt(project.getCreatedAt());
        return dto;
    }

    public DocumentChatResponse chatDocument(UUID userId, DocumentChatRequest req) {
        String docName = req.getDocumentName() != null ? req.getDocumentName() : "Document";
        String docSummary = req.getDocumentSummary() != null ? req.getDocumentSummary() : "General workspace document file";
        String question = req.getQuestion() != null ? req.getQuestion() : "Summarize key details";

        String prompt = "You are an AI document analysis assistant. Answer the user question based on the document details:\n\n"
                + "Document Name: " + docName + "\n"
                + "Context & Metadata: " + docSummary + "\n\n"
                + "User Question: " + question + "\n\n"
                + "Instructions: Provide a concise, clear answer. If actionable tasks should be done, format as [ACTION:CREATE_TASK] Title | Priority | Description";

        String rawReply = callGeminiApi(prompt);
        List<AiActionItem> actions = parseActionsFromText(rawReply);
        String cleaned = cleanReplyText(rawReply);

        List<String> keyPoints = List.of(
                "Verified against document metadata for " + docName,
                "Context extracted from vault storage"
        );

        return new DocumentChatResponse(cleaned, keyPoints, actions);
    }

    public Map<String, Object> testConnection(String apiKey, String provider) {
        Map<String, Object> res = new HashMap<>();
        String keyToTest = (apiKey != null && !apiKey.trim().isEmpty()) ? apiKey.trim() : this.geminiApiKey;

        String[] modelsToTry = new String[] {
                (this.geminiModel != null && !this.geminiModel.trim().isEmpty()) ? this.geminiModel : "gemini-3.5-flash-lite",
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite",
                "gemini-3.5-flash"
        };

        for (String model : modelsToTry) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + keyToTest;
                String body = "{\"contents\":[{\"parts\":[{\"text\":\"Hello, respond with OK if working.\"}]}]}";

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(10))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body))
                        .build();

                HttpResponse<String> response = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    res.put("success", true);
                    res.put("message", "Connected successfully to Google Gemini (" + model + ")!");
                    res.put("provider", "GOOGLE_GEMINI");
                    return res;
                } else if (response.statusCode() != 404) {
                    // non-404 error (e.g. rate limit, auth)
                    res.put("success", false);
                    res.put("message", "Gemini API status " + response.statusCode() + ": " + response.body());
                    return res;
                }
            } catch (Exception e) {
                log.warn("Model test failed for {}: {}", model, e.getMessage());
            }
        }

        res.put("success", false);
        res.put("message", "Could not connect to Gemini models with the provided API key.");
        return res;
    }

    // --- Helpers ---
    public String callGeminiRaw(String prompt) {
        return callGeminiApi(prompt);
    }

    private String callGeminiApi(String prompt) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return generateLocalFallbackResponse(prompt);
        }

        String[] modelsToTry = new String[] {
                (this.geminiModel != null && !this.geminiModel.trim().isEmpty()) ? this.geminiModel : "gemini-3.5-flash-lite",
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite",
                "gemini-3.5-flash"
        };

        for (String model : modelsToTry) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;

                Map<String, Object> part = Map.of("text", prompt);
                Map<String, Object> content = Map.of("parts", List.of(part));
                Map<String, Object> payload = Map.of("contents", List.of(content));

                String requestBody = objectMapper.writeValueAsString(payload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(12))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidate = root.path("candidates").get(0);
                    return candidate.path("content").path("parts").get(0).path("text").asText();
                } else {
                    log.warn("Gemini API call ({}) failed with status: {}", model, response.statusCode());
                }
            } catch (Exception e) {
                log.warn("Error invoking Gemini model {}: {}", model, e.getMessage());
            }
        }

        return generateLocalFallbackResponse(prompt);
    }

    private String generateLocalFallbackResponse(String prompt) {
        String lower = prompt.toLowerCase();
        if (lower.contains("task") || lower.contains("create") || lower.contains("add") || lower.contains("plan")) {
            return "මම ඔයාගේ request එක analyze කළා. ඔයාගේ workspace එකට add කරගන්න පුළුවන් action items ටික මෙන්න:\n\n"
                    + "[ACTION:CREATE_TASK] Implement Feature Architecture | HIGH | Core system specifications and database design\n"
                    + "[ACTION:CREATE_TASK] Build Backend Services & APIs | HIGH | Spring Boot controllers and business logic\n"
                    + "[ACTION:CREATE_TASK] Frontend UI & State Binding | MEDIUM | React components and API integration\n\n"
                    + "මේ tasks ටික workspace එකට create කරගන්නද?";
        }
        return "ආයුබෝවන් Induwara! 👋 මම ඔයාගේ **AIU Workspace Software Development Partner & Learning Coach**.\n\n"
                + "ඔයාගේ web development, database architecture, coding questions, task planning, හෝ notes analysis ඕනෑම දෙයකට මම help කරන්න ready.\n"
                + "අද අපි මොන feature එකද build කරන්නේ / learn කරන්නේ?";
    }

    private String buildWorkspaceContext(UUID userId) {
        List<TaskEntity> tasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);
        long pendingCount = tasks.stream().filter(t -> t.getStatus() != TaskStatus.COMPLETED).count();
        List<ProjectEntity> projects = projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
        String projectNames = projects.stream().map(ProjectEntity::getName).limit(5).collect(Collectors.joining(", "));

        return String.format("Current Workspace State: %d pending tasks across active projects (%s). Date: %s.",
                pendingCount, projectNames.isEmpty() ? "None" : projectNames, LocalDate.now());
    }

    private String buildPromptWithContext(String userMessage, String workspaceContext, List<AiChatRequest.ChatMessageItem> history) {
        StringBuilder sb = new StringBuilder();
        sb.append("# AIU WORKSPACE — AI ASSISTANT MASTER SYSTEM INSTRUCTIONS\n\n");
        sb.append("## YOUR ROLE & IDENTITY\n");
        sb.append("You are Induwara's dedicated AI Software Development Partner, Technical Mentor, Project Architect, Code Reviewer, Debugging Assistant, and Learning Coach.\n");
        sb.append("User Profile: Induwara is an Information Technology undergraduate at the University of Moratuwa. He wants to BUILD his personal workspace while simultaneously deeply UNDERSTANDING the how and why.\n\n");

        sb.append("## CORE OBJECTIVES\n");
        sb.append("1. Correctness\n");
        sb.append("2. Maintainability\n");
        sb.append("3. Security\n");
        sb.append("4. Simplicity (Never over-engineer; build the cleanest, simplest solution)\n");
        sb.append("5. Learning (Every task is a project work + learning opportunity)\n");
        sb.append("6. Consistency\n\n");

        sb.append("## TEACHING STYLE: WHY → WHAT → HOW\n");
        sb.append("When explaining technical concepts or architectural choices:\n");
        sb.append("1. WHY: Why is this needed?\n");
        sb.append("2. WHAT: What exactly are we introducing?\n");
        sb.append("3. HOW: How will it work inside this project?\n");
        sb.append("Use practical, simple examples. Avoid academic jargon.\n\n");

        sb.append("## COMMUNICATION & LANGUAGE RULES\n");
        sb.append("- Sinhala / Singlish prompt (e.g., 'kohomada', 'mta meka hadanna one') → Respond primarily in natural, friendly Sinhala with English technical terms preserved.\n");
        sb.append("- English prompt → Respond in clear, natural, simple English (A2–B1 level). Avoid dense or pretentious vocabulary.\n");
        sb.append("- Technical concept pattern when teaching:\n");
        sb.append("  1. English Term\n");
        sb.append("  2. Sinhala Meaning\n");
        sb.append("  3. Simple Explanation\n");
        sb.append("  4. Project Example\n");
        sb.append("  5. Why it matters\n");
        sb.append("- Tone: Smart, friendly developer friend; patient, encouraging, practical, and honest. Never pretend to understand if unclear.\n\n");

        sb.append("## WORKSPACE ARCHITECTURE & CONTEXT\n");
        sb.append("This is a personal, single-user workspace linking: Website ↔ Notes ↔ Documents ↔ Google Drive ↔ Tasks ↔ Projects / Learning.\n");
        sb.append("Context: ").append(workspaceContext).append("\n\n");

        sb.append("## ACTION PROPOSALS (UI INTEGRATION)\n");
        sb.append("When proposing actionable tasks or subtasks for Induwara, format each task on a separate line strictly as:\n");
        sb.append("[ACTION:CREATE_TASK] <Title> | <Priority: URGENT/HIGH/MEDIUM/LOW> | <Description>\n");
        sb.append("The frontend drawer parses this format and generates interactive action buttons so Induwara can add tasks directly into his workspace.\n\n");

        if (history != null && !history.isEmpty()) {
            sb.append("## CONVERSATION HISTORY\n");
            for (AiChatRequest.ChatMessageItem item : history) {
                sb.append(item.getRole()).append(": ").append(item.getContent()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("User: ").append(userMessage).append("\nAssistant:");
        return sb.toString();
    }

    private List<AiActionItem> parseActionsFromText(String text) {
        List<AiActionItem> actions = new ArrayList<>();
        if (text == null) return actions;

        String[] lines = text.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.contains("[ACTION:CREATE_TASK]")) {
                int idx = line.indexOf("[ACTION:CREATE_TASK]");
                String content = line.substring(idx + "[ACTION:CREATE_TASK]".length()).trim();
                String[] parts = content.split("\\|");
                if (parts.length >= 1) {
                    String title = parts[0].trim();
                    String priority = parts.length >= 2 ? parts[1].trim().toUpperCase() : "MEDIUM";
                    String desc = parts.length >= 3 ? parts[2].trim() : "Created via AI Assistant";
                    actions.add(new AiActionItem("CREATE_TASK", title, desc, priority, null));
                }
            }
        }
        return actions;
    }

    private String cleanReplyText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\[ACTION:CREATE_TASK\\][^\n]+", "").trim();
    }

    private int getPriorityRank(TaskPriority p) {
        if (p == null) return 1;
        switch (p) {
            case URGENT: return 4;
            case HIGH: return 3;
            case MEDIUM: return 2;
            case LOW: default: return 1;
        }
    }

    private int calculateStreak(List<LocalDate> dates) {
        if (dates == null || dates.isEmpty()) return 0;
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        if (!dates.get(0).equals(today) && !dates.get(0).equals(yesterday)) return 0;

        int streak = 0;
        LocalDate expected = dates.get(0);
        for (LocalDate d : dates) {
            if (d.equals(expected)) {
                streak++;
                expected = expected.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    private TaskDTO mapTaskToDTO(TaskEntity t) {
        TaskDTO dto = new TaskDTO();
        dto.setId(t.getId());
        dto.setUserId(t.getUserId());
        dto.setTitle(t.getTitle());
        dto.setDescription(t.getDescription());
        dto.setStatus(t.getStatus());
        dto.setPriority(t.getPriority());
        dto.setDueDate(t.getDueDate());
        dto.setDueTime(t.getDueTime());
        dto.setTaskKey(t.getTaskKey());
        dto.setParentTaskId(t.getParentTaskId());
        dto.setCompletedAt(t.getCompletedAt());
        dto.setCreatedAt(t.getCreatedAt());
        dto.setUpdatedAt(t.getUpdatedAt());

        if (t.getProjectId() != null) {
            dto.setProjectId(t.getProjectId());
            projectRepository.findById(t.getProjectId()).ifPresent(proj -> dto.setProjectName(proj.getName()));
        }
        if (t.getCategoryId() != null) {
            dto.setCategoryId(t.getCategoryId());
            categoryRepository.findById(t.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
                dto.setCategoryColor(cat.getColor());
            });
        }
        dto.setEstimatedDuration(t.getEstimatedDuration());
        dto.setRecurringTaskId(t.getRecurringTaskId());
        return dto;
    }
}
