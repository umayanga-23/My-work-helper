package com.personal.workspace.service;

import com.personal.workspace.dto.AnalyticsSummaryDTO;
import com.personal.workspace.entity.CategoryEntity;
import com.personal.workspace.entity.TaskEntity;
import com.personal.workspace.entity.TaskStatus;
import com.personal.workspace.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;
    private final WebsiteRepository websiteRepository;
    private final DocumentRepository documentRepository;
    private final DriveLinkRepository driveLinkRepository;
    private final ProjectRepository projectRepository;
    private final SkillRepository skillRepository;
    private final IdeaRepository ideaRepository;
    private final CategoryRepository categoryRepository;

    public AnalyticsService(
            TaskRepository taskRepository,
            NoteRepository noteRepository,
            WebsiteRepository websiteRepository,
            DocumentRepository documentRepository,
            DriveLinkRepository driveLinkRepository,
            ProjectRepository projectRepository,
            SkillRepository skillRepository,
            IdeaRepository ideaRepository,
            CategoryRepository categoryRepository) {
        this.taskRepository = taskRepository;
        this.noteRepository = noteRepository;
        this.websiteRepository = websiteRepository;
        this.documentRepository = documentRepository;
        this.driveLinkRepository = driveLinkRepository;
        this.projectRepository = projectRepository;
        this.skillRepository = skillRepository;
        this.ideaRepository = ideaRepository;
        this.categoryRepository = categoryRepository;
    }

    public AnalyticsSummaryDTO getAnalyticsSummary(UUID userId) {
        List<TaskEntity> tasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);

        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        long pendingTasks = totalTasks - completedTasks;

        LocalDate today = LocalDate.now();
        long overdueTasks = tasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getDueDate() != null && t.getDueDate().isBefore(today))
                .count();

        double completionRate = totalTasks > 0 ? ((double) completedTasks / totalTasks) * 100.0 : 0.0;

        Map<UUID, String> categoryMap = categoryRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(CategoryEntity::getId, CategoryEntity::getName, (a, b) -> a));

        Map<String, Long> tasksByPriority = new HashMap<>();
        Map<String, Long> tasksByCategory = new HashMap<>();

        for (TaskEntity task : tasks) {
            String prio = task.getPriority() != null ? task.getPriority().name() : "MEDIUM";
            tasksByPriority.put(prio, tasksByPriority.getOrDefault(prio, 0L) + 1);

            String catName = task.getCategoryId() != null ? categoryMap.getOrDefault(task.getCategoryId(), "General") : "General";
            tasksByCategory.put(catName, tasksByCategory.getOrDefault(catName, 0L) + 1);
        }

        // Generate past 7 days trend
        List<AnalyticsSummaryDTO.DailyActivityDTO> weeklyTrends = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dayOfWeek = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            long completedOnDate = tasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.COMPLETED && t.getUpdatedAt() != null && t.getUpdatedAt().toLocalDate().equals(date))
                    .count();

            long createdOnDate = tasks.stream()
                    .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().equals(date))
                    .count();

            weeklyTrends.add(new AnalyticsSummaryDTO.DailyActivityDTO(date.toString(), dayOfWeek, completedOnDate, createdOnDate));
        }

        AnalyticsSummaryDTO dto = new AnalyticsSummaryDTO();
        dto.setTotalTasks(totalTasks);
        dto.setCompletedTasks(completedTasks);
        dto.setPendingTasks(pendingTasks);
        dto.setOverdueTasks(overdueTasks);
        dto.setCompletionRate(Math.round(completionRate * 10.0) / 10.0);

        dto.setTotalNotes(noteRepository.findByUserIdOrderByCreatedAtDesc(userId).size());
        dto.setTotalWebsites(websiteRepository.findByUserIdOrderByCreatedAtDesc(userId).size());
        dto.setTotalDocuments(documentRepository.findByUserIdOrderByCreatedAtDesc(userId).size());
        dto.setTotalDriveLinks(driveLinkRepository.findByUserIdOrderByCreatedAtDesc(userId).size());
        dto.setTotalProjects(projectRepository.findByUserIdOrderByCreatedAtDesc(userId).size());
        dto.setTotalSkills(skillRepository.findByUserIdOrderByProficiencyPercentDesc(userId).size());
        dto.setTotalIdeas(ideaRepository.findByUserIdOrderByCreatedAtDesc(userId).size());

        dto.setTasksByCategory(tasksByCategory);
        dto.setTasksByPriority(tasksByPriority);
        dto.setWeeklyTrends(weeklyTrends);

        return dto;
    }
}
