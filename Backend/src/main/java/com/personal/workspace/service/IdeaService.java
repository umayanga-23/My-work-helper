package com.personal.workspace.service;

import com.personal.workspace.dto.IdeaDTO;
import com.personal.workspace.dto.IdeaRequest;
import com.personal.workspace.dto.ProjectDTO;
import com.personal.workspace.dto.ProjectRequest;
import com.personal.workspace.entity.IdeaEntity;
import com.personal.workspace.entity.IdeaStatus;
import com.personal.workspace.entity.ProjectStatus;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.IdeaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IdeaService {

    private final IdeaRepository ideaRepository;
    private final ProjectService projectService;

    public IdeaService(IdeaRepository ideaRepository, ProjectService projectService) {
        this.ideaRepository = ideaRepository;
        this.projectService = projectService;
    }

    public List<IdeaDTO> getIdeas(UUID userId, IdeaStatus status, String search) {
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        List<IdeaEntity> entities = ideaRepository.filterIdeas(userId, status, searchPattern);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public IdeaDTO getIdeaById(UUID userId, UUID id) {
        IdeaEntity entity = ideaRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public IdeaDTO createIdea(UUID userId, IdeaRequest request) {
        IdeaEntity idea = new IdeaEntity();
        idea.setUserId(userId);
        idea.setTitle(request.getTitle().trim());
        idea.setDescription(request.getDescription());
        idea.setCategory(request.getCategory() != null ? request.getCategory() : "Software Architecture");
        idea.setStatus(request.getStatus() != null ? request.getStatus() : IdeaStatus.IDEA);
        idea.setTags(request.getTags() != null ? String.join(",", request.getTags()) : null);

        IdeaEntity saved = ideaRepository.save(idea);
        return mapToDTO(saved);
    }

    @Transactional
    public IdeaDTO updateIdea(UUID userId, UUID id, IdeaRequest request) {
        IdeaEntity idea = ideaRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + id));

        idea.setTitle(request.getTitle().trim());
        idea.setDescription(request.getDescription());
        if (request.getCategory() != null) idea.setCategory(request.getCategory());
        if (request.getStatus() != null) idea.setStatus(request.getStatus());
        idea.setTags(request.getTags() != null ? String.join(",", request.getTags()) : null);

        IdeaEntity updated = ideaRepository.save(idea);
        return mapToDTO(updated);
    }

    @Transactional
    public IdeaDTO updateIdeaStatus(UUID userId, UUID id, IdeaStatus status) {
        IdeaEntity idea = ideaRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + id));

        idea.setStatus(status);
        IdeaEntity updated = ideaRepository.save(idea);
        return mapToDTO(updated);
    }

    @Transactional
    public ProjectDTO convertIdeaToProject(UUID userId, UUID ideaId) {
        IdeaEntity idea = ideaRepository.findByIdAndUserId(ideaId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + ideaId));

        ProjectRequest projectRequest = new ProjectRequest();
        projectRequest.setName(idea.getTitle());
        projectRequest.setDescription("Converted from Idea Incubator: " + (idea.getDescription() != null ? idea.getDescription() : ""));
        projectRequest.setStatus(ProjectStatus.PLANNING);
        projectRequest.setStartDate(LocalDate.now());
        projectRequest.setProgress(0);

        ProjectDTO createdProject = projectService.createProject(userId, projectRequest);

        idea.setStatus(IdeaStatus.CONVERTED_TO_PROJECT);
        idea.setConvertedProjectId(createdProject.getId());
        ideaRepository.save(idea);

        return createdProject;
    }

    @Transactional
    public void deleteIdea(UUID userId, UUID id) {
        IdeaEntity idea = ideaRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Idea not found with id: " + id));
        ideaRepository.delete(idea);
    }

    private IdeaDTO mapToDTO(IdeaEntity entity) {
        IdeaDTO dto = new IdeaDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setCategory(entity.getCategory());
        dto.setStatus(entity.getStatus());
        dto.setConvertedProjectId(entity.getConvertedProjectId());
        
        if (entity.getTags() != null && !entity.getTags().trim().isEmpty()) {
            dto.setTags(Arrays.asList(entity.getTags().split(",")));
        } else {
            dto.setTags(Collections.emptyList());
        }

        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
