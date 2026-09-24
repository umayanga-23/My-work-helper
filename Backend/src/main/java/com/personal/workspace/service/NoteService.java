package com.personal.workspace.service;

import com.personal.workspace.dto.NoteDTO;
import com.personal.workspace.dto.NoteRequest;
import com.personal.workspace.entity.NoteEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final CategoryRepository categoryRepository;
    private final ActivityLogService activityLogService;

    public NoteService(NoteRepository noteRepository, CategoryRepository categoryRepository, ActivityLogService activityLogService) {
        this.noteRepository = noteRepository;
        this.categoryRepository = categoryRepository;
        this.activityLogService = activityLogService;
    }

    public List<NoteDTO> getNotes(UUID userId, UUID categoryId, UUID projectId, Boolean isFavorite, Boolean isArchived, String search) {
        String searchPattern = (search != null && !search.trim().isEmpty())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        List<NoteEntity> entities = noteRepository.filterNotes(userId, categoryId, projectId, isFavorite, isArchived, searchPattern);
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public NoteDTO getNoteById(UUID userId, UUID id) {
        NoteEntity entity = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public NoteDTO createNote(UUID userId, NoteRequest request) {
        NoteEntity note = new NoteEntity();
        note.setUserId(userId);
        note.setTitle(request.getTitle().trim());
        note.setContent(request.getContent());
        note.setTags(request.getTags() != null ? String.join(",", request.getTags()) : null);
        note.setFavorite(request.isFavorite());
        note.setArchived(request.isArchived());
        note.setCategoryId(request.getCategoryId());
        note.setProjectId(request.getProjectId());

        NoteEntity saved = noteRepository.save(note);
        if (saved.getProjectId() != null) {
            activityLogService.logSafe(userId, saved.getProjectId(), "Note added", "NOTE", saved.getId(), saved.getTitle());
        }
        return mapToDTO(saved);
    }

    @Transactional
    public NoteDTO updateNote(UUID userId, UUID id, NoteRequest request) {
        NoteEntity note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        note.setTitle(request.getTitle().trim());
        note.setContent(request.getContent());
        note.setTags(request.getTags() != null ? String.join(",", request.getTags()) : null);
        note.setFavorite(request.isFavorite());
        note.setArchived(request.isArchived());
        note.setCategoryId(request.getCategoryId());
        note.setProjectId(request.getProjectId());

        NoteEntity updated = noteRepository.save(note);
        if (updated.getProjectId() != null) {
            activityLogService.logSafe(userId, updated.getProjectId(), "Note updated", "NOTE", updated.getId(), updated.getTitle());
        }
        return mapToDTO(updated);
    }

    @Transactional
    public NoteDTO toggleFavorite(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        note.setFavorite(!note.isFavorite());
        NoteEntity updated = noteRepository.save(note);
        return mapToDTO(updated);
    }

    @Transactional
    public NoteDTO toggleArchive(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        note.setArchived(!note.isArchived());
        NoteEntity updated = noteRepository.save(note);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteNote(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));
        noteRepository.delete(note);
    }

    private NoteDTO mapToDTO(NoteEntity entity) {
        NoteDTO dto = new NoteDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setProjectId(entity.getProjectId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setTitle(entity.getTitle());
        dto.setContent(entity.getContent());
        
        if (entity.getTags() != null && !entity.getTags().trim().isEmpty()) {
            dto.setTags(Arrays.asList(entity.getTags().split(",")));
        } else {
            dto.setTags(Collections.emptyList());
        }

        dto.setFavorite(entity.isFavorite());
        dto.setArchived(entity.isArchived());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
            });
        }

        return dto;
    }
}
