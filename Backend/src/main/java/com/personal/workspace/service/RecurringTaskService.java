package com.personal.workspace.service;

import com.personal.workspace.dto.RecurringTaskDTO;
import com.personal.workspace.dto.RecurringTaskRequest;
import com.personal.workspace.entity.*;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.ProjectRepository;
import com.personal.workspace.repository.RecurringTaskRepository;
import com.personal.workspace.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecurringTaskService {

    private static final Logger log = LoggerFactory.getLogger(RecurringTaskService.class);

    private final RecurringTaskRepository recurringTaskRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CategoryRepository categoryRepository;
    private final ActivityLogService activityLogService;

    public RecurringTaskService(RecurringTaskRepository recurringTaskRepository,
                                TaskRepository taskRepository,
                                ProjectRepository projectRepository,
                                CategoryRepository categoryRepository,
                                ActivityLogService activityLogService) {
        this.recurringTaskRepository = recurringTaskRepository;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.categoryRepository = categoryRepository;
        this.activityLogService = activityLogService;
    }

    public List<RecurringTaskDTO> getRecurringTasks(UUID userId) {
        return recurringTaskRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public RecurringTaskDTO getRecurringTaskById(UUID userId, UUID id) {
        RecurringTaskEntity entity = recurringTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring task template not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public RecurringTaskDTO createRecurringTask(UUID userId, RecurringTaskRequest request) {
        RecurringTaskEntity entity = new RecurringTaskEntity();
        entity.setUserId(userId);
        entity.setTitle(request.getTitle().trim());
        entity.setDescription(request.getDescription());
        entity.setProjectId(request.getProjectId());
        entity.setCategoryId(request.getCategoryId());
        entity.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        entity.setDueTime(request.getDueTime());
        entity.setEstimatedDuration(request.getEstimatedDuration());
        entity.setRecurrenceType(request.getRecurrenceType() != null ? request.getRecurrenceType() : RecurrenceType.DAILY);
        entity.setRecurrenceConfig(request.getRecurrenceConfig());
        entity.setStartDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now());
        entity.setEndDate(request.getEndDate());
        entity.setStatus(RecurringTaskStatus.ACTIVE);

        RecurringTaskEntity saved = recurringTaskRepository.save(entity);

        // Immediate evaluation: if today is a valid occurrence date, generate today's instance right away!
        LocalDate today = LocalDate.now();
        if (isScheduledForDate(saved, today)) {
            generateInstanceForTemplate(saved, today);
        }

        if (saved.getProjectId() != null) {
            activityLogService.logSafe(userId, saved.getProjectId(), "Recurring task created", "RECURRING_TASK", saved.getId(), saved.getTitle());
        }

        return mapToDTO(saved);
    }

    @Transactional
    public RecurringTaskDTO updateRecurringTask(UUID userId, UUID id, RecurringTaskRequest request) {
        RecurringTaskEntity entity = recurringTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring task template not found with id: " + id));

        entity.setTitle(request.getTitle().trim());
        entity.setDescription(request.getDescription());
        entity.setProjectId(request.getProjectId());
        entity.setCategoryId(request.getCategoryId());
        if (request.getPriority() != null) entity.setPriority(request.getPriority());
        entity.setDueTime(request.getDueTime());
        entity.setEstimatedDuration(request.getEstimatedDuration());
        if (request.getRecurrenceType() != null) entity.setRecurrenceType(request.getRecurrenceType());
        entity.setRecurrenceConfig(request.getRecurrenceConfig());
        if (request.getStartDate() != null) entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());

        RecurringTaskEntity updated = recurringTaskRepository.save(entity);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteRecurringTask(UUID userId, UUID id) {
        RecurringTaskEntity entity = recurringTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring task template not found with id: " + id));
        // Per specifications: Historical generated tasks are kept intact!
        recurringTaskRepository.delete(entity);
    }

    @Transactional
    public RecurringTaskDTO pauseRecurringTask(UUID userId, UUID id) {
        RecurringTaskEntity entity = recurringTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring task template not found with id: " + id));
        entity.setStatus(RecurringTaskStatus.PAUSED);
        RecurringTaskEntity saved = recurringTaskRepository.save(entity);
        return mapToDTO(saved);
    }

    @Transactional
    public RecurringTaskDTO resumeRecurringTask(UUID userId, UUID id) {
        RecurringTaskEntity entity = recurringTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring task template not found with id: " + id));
        entity.setStatus(RecurringTaskStatus.ACTIVE);
        RecurringTaskEntity saved = recurringTaskRepository.save(entity);

        // Check if today matches when resumed
        LocalDate today = LocalDate.now();
        if (isScheduledForDate(saved, today)) {
            generateInstanceForTemplate(saved, today);
        }

        return mapToDTO(saved);
    }

    /**
     * Core generation logic for a given date.
     * Can be called by the 4:00 AM scheduler, or on-demand on user request.
     * Implements strict idempotency checking: task is created ONLY if it does not already exist.
     */
    @Transactional
    public Map<String, Object> generateInstancesForDate(LocalDate targetDate, UUID specificUserId) {
        log.info("Recurring task generator started for date: {}", targetDate);
        List<RecurringTaskEntity> templates;
        if (specificUserId != null) {
            templates = recurringTaskRepository.findActiveTemplatesForUserAndDate(specificUserId, RecurringTaskStatus.ACTIVE, targetDate);
        } else {
            templates = recurringTaskRepository.findActiveTemplatesForDate(RecurringTaskStatus.ACTIVE, targetDate);
        }

        int checkedCount = templates.size();
        int createdCount = 0;
        int alreadyExistedCount = 0;
        int skippedCount = 0;

        for (RecurringTaskEntity template : templates) {
            if (!isScheduledForDate(template, targetDate)) {
                skippedCount++;
                continue;
            }

            // 🛡️ Idempotency check: does an instance for this recurring task and date already exist?
            boolean exists = taskRepository.existsByRecurringTaskIdAndDueDate(template.getId(), targetDate);
            if (exists) {
                alreadyExistedCount++;
                continue;
            }

            // Create instance
            boolean generated = generateInstanceForTemplate(template, targetDate);
            if (generated) {
                createdCount++;
            } else {
                alreadyExistedCount++;
            }
        }

        log.info("Recurring task generation completed. Checked: {}, Created: {}, Already Existed: {}, Skipped: {}",
                checkedCount, createdCount, alreadyExistedCount, skippedCount);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", targetDate.toString());
        result.put("checked", checkedCount);
        result.put("created", createdCount);
        result.put("alreadyExisted", alreadyExistedCount);
        result.put("skipped", skippedCount);
        return result;
    }

    /**
     * Generates a single task instance for a recurring task template and date.
     * Guaranteed to be idempotent via DB check.
     */
    @Transactional
    public boolean generateInstanceForTemplate(RecurringTaskEntity template, LocalDate targetDate) {
        if (taskRepository.existsByRecurringTaskIdAndDueDate(template.getId(), targetDate)) {
            return false;
        }

        TaskEntity instance = new TaskEntity();
        instance.setUserId(template.getUserId());
        instance.setTitle(template.getTitle());
        instance.setDescription(template.getDescription());
        instance.setPriority(template.getPriority());
        instance.setStatus(TaskStatus.TODO);
        instance.setDueDate(targetDate);
        instance.setDueTime(template.getDueTime());
        instance.setEstimatedDuration(template.getEstimatedDuration());
        instance.setProjectId(template.getProjectId());
        instance.setCategoryId(template.getCategoryId());
        instance.setRecurringTaskId(template.getId());

        // Assign task key
        if (template.getProjectId() != null) {
            projectRepository.findById(template.getProjectId()).ifPresent(proj -> {
                String prefix = proj.getProjectKey() != null && !proj.getProjectKey().trim().isEmpty()
                        ? proj.getProjectKey() : "AIU";
                long count = taskRepository.countByProjectId(proj.getId()) + 1;
                instance.setTaskKey(prefix.toUpperCase().trim() + "-" + count);
            });
        } else {
            long count = taskRepository.countByUserId(template.getUserId()) + 1;
            instance.setTaskKey("AIU-" + count);
        }

        taskRepository.save(instance);
        template.setLastGeneratedDate(targetDate);
        recurringTaskRepository.save(template);

        log.info("Generated task instance '{}' (Key: {}) for recurring template {} on date {}",
                instance.getTitle(), instance.getTaskKey(), template.getId(), targetDate);
        return true;
    }

    /**
     * Evaluates whether a recurring task template should occur on the given target date.
     */
    public boolean isScheduledForDate(RecurringTaskEntity task, LocalDate date) {
        if (task.getStatus() != RecurringTaskStatus.ACTIVE) {
            return false;
        }
        if (date.isBefore(task.getStartDate())) {
            return false;
        }
        if (task.getEndDate() != null && date.isAfter(task.getEndDate())) {
            return false;
        }

        switch (task.getRecurrenceType()) {
            case DAILY:
                return true;

            case WEEKLY:
                return isWeeklyMatch(task, date);

            case MONTHLY:
                return isMonthlyMatch(task, date);

            default:
                return false;
        }
    }

    private boolean isWeeklyMatch(RecurringTaskEntity task, LocalDate date) {
        String config = task.getRecurrenceConfig();
        DayOfWeek targetDay = date.getDayOfWeek();

        // If no custom days configured, defaults to the day of week of startDate
        if (config == null || config.trim().isEmpty()) {
            return targetDay == task.getStartDate().getDayOfWeek();
        }

        // Clean config string: e.g. "MONDAY, WEDNESDAY" or "[\"MONDAY\", \"WEDNESDAY\"]"
        String normalized = config.toUpperCase()
                .replace("[", "")
                .replace("]", "")
                .replace("\"", "")
                .replace("'", "");
        Set<String> days = Arrays.stream(normalized.split(","))
                .map(String::trim)
                .collect(Collectors.toSet());

        return days.contains(targetDay.name());
    }

    private boolean isMonthlyMatch(RecurringTaskEntity task, LocalDate date) {
        int targetDayOfMonth = date.getDayOfMonth();
        int expectedDayOfMonth = task.getStartDate().getDayOfMonth();

        String config = task.getRecurrenceConfig();
        if (config != null && !config.trim().isEmpty()) {
            try {
                expectedDayOfMonth = Integer.parseInt(config.trim());
            } catch (NumberFormatException ignored) {}
        }

        // Handle month-end clamping (e.g. day 31 in a 30-day or 28-day month)
        int maxDaysInMonth = date.lengthOfMonth();
        int clampedExpectedDay = Math.min(expectedDayOfMonth, maxDaysInMonth);

        return targetDayOfMonth == clampedExpectedDay;
    }

    public RecurringTaskDTO mapToDTO(RecurringTaskEntity entity) {
        RecurringTaskDTO dto = new RecurringTaskDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setProjectId(entity.getProjectId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setPriority(entity.getPriority());
        dto.setDueTime(entity.getDueTime());
        dto.setEstimatedDuration(entity.getEstimatedDuration());
        dto.setRecurrenceType(entity.getRecurrenceType());
        dto.setRecurrenceConfig(entity.getRecurrenceConfig());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setStatus(entity.getStatus());
        dto.setLastGeneratedDate(entity.getLastGeneratedDate());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
                dto.setCategoryColor(cat.getColor());
            });
        }

        if (entity.getProjectId() != null) {
            projectRepository.findById(entity.getProjectId()).ifPresent(proj -> {
                dto.setProjectName(proj.getName());
            });
        }

        return dto;
    }
}
