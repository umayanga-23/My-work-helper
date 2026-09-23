package com.personal.workspace.service;

import com.personal.workspace.dto.*;
import com.personal.workspace.entity.*;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SkillService {

    private final SkillRepository skillRepository;
    private final LearningTopicRepository learningTopicRepository;
    private final LearningResourceRepository learningResourceRepository;
    private final StudySessionRepository studySessionRepository;
    private final SkillCertificateRepository skillCertificateRepository;
    private final SkillProjectRepository skillProjectRepository;
    private final ProjectRepository projectRepository;

    public SkillService(SkillRepository skillRepository,
                        LearningTopicRepository learningTopicRepository,
                        LearningResourceRepository learningResourceRepository,
                        StudySessionRepository studySessionRepository,
                        SkillCertificateRepository skillCertificateRepository,
                        SkillProjectRepository skillProjectRepository,
                        ProjectRepository projectRepository) {
        this.skillRepository = skillRepository;
        this.learningTopicRepository = learningTopicRepository;
        this.learningResourceRepository = learningResourceRepository;
        this.studySessionRepository = studySessionRepository;
        this.skillCertificateRepository = skillCertificateRepository;
        this.skillProjectRepository = skillProjectRepository;
        this.projectRepository = projectRepository;
    }

    public List<SkillDTO> getSkills(UUID userId) {
        List<SkillEntity> entities = skillRepository.findByUserIdOrderByProficiencyPercentDesc(userId);
        if (entities.isEmpty()) {
            entities = seedDefaultSkills(userId);
        }
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public SkillDTO getSkillById(UUID userId, UUID id) {
        SkillEntity entity = skillRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public SkillDTO createSkill(UUID userId, SkillRequest request) {
        SkillEntity skill = new SkillEntity();
        skill.setUserId(userId);
        skill.setName(request.getName().trim());
        skill.setCategory(request.getCategory() != null ? request.getCategory() : "Backend Development");
        skill.setProficiencyPercent(request.getProficiencyPercent() != null ? request.getProficiencyPercent() : 0);
        skill.setTargetLevel(request.getTargetLevel() != null ? request.getTargetLevel() : "Advanced");
        skill.setNotes(request.getNotes());

        SkillEntity saved = skillRepository.save(skill);
        return mapToDTO(saved);
    }

    @Transactional
    public SkillDTO updateSkill(UUID userId, UUID id, SkillRequest request) {
        SkillEntity skill = skillRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + id));

        skill.setName(request.getName().trim());
        if (request.getCategory() != null) skill.setCategory(request.getCategory());
        if (request.getProficiencyPercent() != null) skill.setProficiencyPercent(request.getProficiencyPercent());
        if (request.getTargetLevel() != null) skill.setTargetLevel(request.getTargetLevel());
        skill.setNotes(request.getNotes());

        SkillEntity updated = skillRepository.save(skill);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteSkill(UUID userId, UUID id) {
        SkillEntity skill = skillRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + id));
        skillRepository.delete(skill);
    }

    @Transactional
    public LearningTopicDTO createTopic(UUID userId, UUID skillId, LearningTopicRequest request) {
        SkillEntity skill = skillRepository.findByIdAndUserId(skillId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillId));

        LearningTopicEntity topic = new LearningTopicEntity();
        topic.setUserId(userId);
        topic.setSkill(skill);
        topic.setTitle(request.getTitle().trim());
        topic.setDescription(request.getDescription());
        topic.setStatus(request.getStatus() != null ? request.getStatus() : TopicStatus.NOT_STARTED);
        topic.setProgressPercent(request.getProgressPercent() != null ? request.getProgressPercent() : 0);

        LearningTopicEntity saved = learningTopicRepository.save(topic);
        recalculateSkillProficiency(skill);

        return mapTopicToDTO(saved);
    }

    @Transactional
    public LearningTopicDTO updateTopicStatus(UUID userId, UUID topicId, TopicStatus status) {
        LearningTopicEntity topic = learningTopicRepository.findByIdAndUserId(topicId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + topicId));

        topic.setStatus(status);
        if (status == TopicStatus.MASTERED) {
            topic.setProgressPercent(100);
        } else if (status == TopicStatus.NOT_STARTED) {
            topic.setProgressPercent(0);
        }

        LearningTopicEntity updated = learningTopicRepository.save(topic);
        recalculateSkillProficiency(topic.getSkill());

        return mapTopicToDTO(updated);
    }

    @Transactional
    public LearningTopicDTO updateTopicNotes(UUID userId, UUID topicId, String notes, String cheatsheet) {
        LearningTopicEntity topic = learningTopicRepository.findByIdAndUserId(topicId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + topicId));

        topic.setNotes(notes);
        topic.setCheatsheet(cheatsheet);

        LearningTopicEntity updated = learningTopicRepository.save(topic);
        return mapTopicToDTO(updated);
    }

    // --- Learning Resources ---
    @Transactional
    public LearningResourceDTO addResource(UUID userId, UUID skillId, LearningResourceRequest request) {
        SkillEntity skill = skillRepository.findByIdAndUserId(skillId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillId));

        LearningTopicEntity topic = null;
        if (request.getTopicId() != null) {
            topic = learningTopicRepository.findByIdAndUserId(request.getTopicId(), userId).orElse(null);
        }

        LearningResourceEntity entity = new LearningResourceEntity(
                userId, skill, topic, request.getTitle(), request.getUrl(), request.getResourceType()
        );
        LearningResourceEntity saved = learningResourceRepository.save(entity);
        return mapResourceToDTO(saved);
    }

    @Transactional
    public void deleteResource(UUID userId, UUID resourceId) {
        LearningResourceEntity entity = learningResourceRepository.findByIdAndUserId(resourceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));
        learningResourceRepository.delete(entity);
    }

    // --- Study Sessions & Streak Tracker ---
    @Transactional
    public StudySessionDTO logStudySession(UUID userId, StudySessionRequest request) {
        SkillEntity skill = null;
        if (request.getSkillId() != null) {
            skill = skillRepository.findByIdAndUserId(request.getSkillId(), userId).orElse(null);
        }

        LearningTopicEntity topic = null;
        if (request.getTopicId() != null) {
            topic = learningTopicRepository.findByIdAndUserId(request.getTopicId(), userId).orElse(null);
        }

        LocalDate sessionDate = request.getSessionDate() != null ? request.getSessionDate() : LocalDate.now();
        StudySessionEntity session = new StudySessionEntity(
                userId, skill, topic, request.getDurationMinutes(), sessionDate, request.getNotes()
        );
        StudySessionEntity saved = studySessionRepository.save(session);
        return mapSessionToDTO(saved);
    }

    public StudyStatsDTO getStudyStats(UUID userId) {
        Long totalMinutes = studySessionRepository.getTotalStudyMinutesByUserId(userId);
        Long todayMinutes = studySessionRepository.getTodayStudyMinutesByUserId(userId, LocalDate.now());
        List<LocalDate> sessionDates = studySessionRepository.findDistinctSessionDatesByUserId(userId);

        int currentStreak = calculateDailyStreak(sessionDates);
        double totalHours = Math.round((totalMinutes / 60.0) * 10.0) / 10.0;

        List<SkillEntity> skills = skillRepository.findByUserIdOrderByProficiencyPercentDesc(userId);
        int totalSkills = skills.size();
        int totalMasteredTopics = 0;
        for (SkillEntity s : skills) {
            if (s.getTopics() != null) {
                totalMasteredTopics += s.getTopics().stream().filter(t -> t.getStatus() == TopicStatus.MASTERED).count();
            }
        }

        List<StudySessionDTO> recentSessions = studySessionRepository.findByUserIdOrderBySessionDateDescCreatedAtDesc(userId)
                .stream()
                .limit(10)
                .map(this::mapSessionToDTO)
                .collect(Collectors.toList());

        return new StudyStatsDTO(
                currentStreak,
                totalMinutes,
                totalHours,
                todayMinutes,
                totalMasteredTopics,
                totalSkills,
                recentSessions
        );
    }

    private int calculateDailyStreak(List<LocalDate> distinctDatesDesc) {
        if (distinctDatesDesc == null || distinctDatesDesc.isEmpty()) {
            return 0;
        }

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        LocalDate firstDate = distinctDatesDesc.get(0);
        if (!firstDate.equals(today) && !firstDate.equals(yesterday)) {
            return 0; // streak broken
        }

        int streak = 0;
        LocalDate expectedDate = firstDate;

        for (LocalDate date : distinctDatesDesc) {
            if (date.equals(expectedDate)) {
                streak++;
                expectedDate = expectedDate.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    // --- Certificates ---
    @Transactional
    public SkillCertificateDTO addCertificate(UUID userId, UUID skillId, SkillCertificateRequest request) {
        SkillEntity skill = skillRepository.findByIdAndUserId(skillId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillId));

        SkillCertificateEntity cert = new SkillCertificateEntity(
                userId, skill, request.getTitle(), request.getIssuer(), request.getIssueDate(),
                request.getCredentialUrl(), request.getCertificateUrl()
        );
        SkillCertificateEntity saved = skillCertificateRepository.save(cert);
        return mapCertificateToDTO(saved);
    }

    @Transactional
    public void deleteCertificate(UUID userId, UUID certificateId) {
        SkillCertificateEntity cert = skillCertificateRepository.findByIdAndUserId(certificateId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found with id: " + certificateId));
        skillCertificateRepository.delete(cert);
    }

    // --- Linked Projects ---
    @Transactional
    public SkillProjectDTO linkProjectToSkill(UUID userId, UUID skillId, UUID projectId) {
        SkillEntity skill = skillRepository.findByIdAndUserId(skillId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillId));
        ProjectEntity project = projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Optional<SkillProjectEntity> existing = skillProjectRepository.findBySkillIdAndProjectId(skillId, projectId);
        if (existing.isPresent()) {
            return mapProjectToDTO(existing.get());
        }

        SkillProjectEntity link = new SkillProjectEntity(userId, skill, project);
        SkillProjectEntity saved = skillProjectRepository.save(link);
        return mapProjectToDTO(saved);
    }

    @Transactional
    public void unlinkProjectFromSkill(UUID userId, UUID skillId, UUID projectId) {
        skillProjectRepository.deleteBySkillIdAndProjectId(skillId, projectId);
    }

    private void recalculateSkillProficiency(SkillEntity skill) {
        List<LearningTopicEntity> topics = learningTopicRepository.findBySkillId(skill.getId());
        if (!topics.isEmpty()) {
            long masteredCount = topics.stream().filter(t -> t.getStatus() == TopicStatus.MASTERED).count();
            int calcProficiency = (int) Math.round(((double) masteredCount / topics.size()) * 100);
            skill.setProficiencyPercent(calcProficiency);
            skillRepository.save(skill);
        }
    }

    private List<SkillEntity> seedDefaultSkills(UUID userId) {
        SkillEntity java = new SkillEntity();
        java.setUserId(userId); java.setName("Java 17+"); java.setCategory("Backend Development"); java.setProficiencyPercent(80); java.setTargetLevel("Expert");

        SkillEntity react = new SkillEntity();
        react.setUserId(userId); react.setName("React & TypeScript"); react.setCategory("Frontend Development"); react.setProficiencyPercent(60); react.setTargetLevel("Advanced");

        SkillEntity spring = new SkillEntity();
        spring.setUserId(userId); spring.setName("Spring Boot 3"); spring.setCategory("Backend Development"); spring.setProficiencyPercent(50); spring.setTargetLevel("Advanced");

        SkillEntity sql = new SkillEntity();
        sql.setUserId(userId); sql.setName("PostgreSQL & SQL"); sql.setCategory("Database Architecture"); sql.setProficiencyPercent(70); sql.setTargetLevel("Advanced");

        SkillEntity algos = new SkillEntity();
        algos.setUserId(userId); algos.setName("Algorithms & Data Structures"); algos.setCategory("Computer Science"); algos.setProficiencyPercent(40); algos.setTargetLevel("Expert");

        return skillRepository.saveAll(Arrays.asList(java, react, spring, sql, algos));
    }

    private SkillDTO mapToDTO(SkillEntity entity) {
        SkillDTO dto = new SkillDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setName(entity.getName());
        dto.setCategory(entity.getCategory());
        dto.setProficiencyPercent(entity.getProficiencyPercent());
        dto.setTargetLevel(entity.getTargetLevel());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getTopics() != null && !entity.getTopics().isEmpty()) {
            List<LearningTopicDTO> topicDTOs = entity.getTopics().stream()
                    .map(this::mapTopicToDTO)
                    .collect(Collectors.toList());
            dto.setTopics(topicDTOs);
        }

        if (entity.getResources() != null && !entity.getResources().isEmpty()) {
            List<LearningResourceDTO> resourceDTOs = entity.getResources().stream()
                    .map(this::mapResourceToDTO)
                    .collect(Collectors.toList());
            dto.setResources(resourceDTOs);
        }

        if (entity.getCertificates() != null && !entity.getCertificates().isEmpty()) {
            List<SkillCertificateDTO> certDTOs = entity.getCertificates().stream()
                    .map(this::mapCertificateToDTO)
                    .collect(Collectors.toList());
            dto.setCertificates(certDTOs);
        }

        if (entity.getProjects() != null && !entity.getProjects().isEmpty()) {
            List<SkillProjectDTO> projectDTOs = entity.getProjects().stream()
                    .map(this::mapProjectToDTO)
                    .collect(Collectors.toList());
            dto.setProjects(projectDTOs);
        }

        return dto;
    }

    private LearningTopicDTO mapTopicToDTO(LearningTopicEntity topic) {
        LearningTopicDTO dto = new LearningTopicDTO();
        dto.setId(topic.getId());
        dto.setUserId(topic.getUserId());
        dto.setSkillId(topic.getSkill().getId());
        dto.setTitle(topic.getTitle());
        dto.setDescription(topic.getDescription());
        dto.setNotes(topic.getNotes());
        dto.setCheatsheet(topic.getCheatsheet());
        dto.setStatus(topic.getStatus());
        dto.setProgressPercent(topic.getProgressPercent());
        dto.setCreatedAt(topic.getCreatedAt());
        dto.setUpdatedAt(topic.getUpdatedAt());

        if (topic.getResources() != null && !topic.getResources().isEmpty()) {
            dto.setResources(topic.getResources().stream().map(this::mapResourceToDTO).collect(Collectors.toList()));
        }

        return dto;
    }

    private LearningResourceDTO mapResourceToDTO(LearningResourceEntity res) {
        return new LearningResourceDTO(
                res.getId(),
                res.getUserId(),
                res.getSkill() != null ? res.getSkill().getId() : null,
                res.getTopic() != null ? res.getTopic().getId() : null,
                res.getTitle(),
                res.getUrl(),
                res.getResourceType(),
                res.getCreatedAt()
        );
    }

    private StudySessionDTO mapSessionToDTO(StudySessionEntity session) {
        StudySessionDTO dto = new StudySessionDTO();
        dto.setId(session.getId());
        dto.setUserId(session.getUserId());
        dto.setSkillId(session.getSkill() != null ? session.getSkill().getId() : null);
        dto.setSkillName(session.getSkill() != null ? session.getSkill().getName() : null);
        dto.setTopicId(session.getTopic() != null ? session.getTopic().getId() : null);
        dto.setTopicTitle(session.getTopic() != null ? session.getTopic().getTitle() : null);
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setSessionDate(session.getSessionDate());
        dto.setNotes(session.getNotes());
        dto.setCreatedAt(session.getCreatedAt());
        return dto;
    }

    private SkillCertificateDTO mapCertificateToDTO(SkillCertificateEntity cert) {
        return new SkillCertificateDTO(
                cert.getId(),
                cert.getUserId(),
                cert.getSkill() != null ? cert.getSkill().getId() : null,
                cert.getTitle(),
                cert.getIssuer(),
                cert.getIssueDate(),
                cert.getCredentialUrl(),
                cert.getCertificateUrl(),
                cert.getCreatedAt()
        );
    }

    private SkillProjectDTO mapProjectToDTO(SkillProjectEntity sp) {
        ProjectEntity p = sp.getProject();
        return new SkillProjectDTO(
                sp.getId(),
                sp.getUserId(),
                sp.getSkill() != null ? sp.getSkill().getId() : null,
                p.getId(),
                p.getName(),
                p.getStatus() != null ? p.getStatus().name() : "IN_PROGRESS",
                p.getProgress(),
                sp.getCreatedAt()
        );
    }
}
