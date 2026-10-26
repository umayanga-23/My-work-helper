package com.personal.workspace.service;

import com.personal.workspace.dto.FolderDTO;
import com.personal.workspace.dto.FolderRequest;
import com.personal.workspace.entity.FolderEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CategoryRepository;
import com.personal.workspace.repository.DocumentRepository;
import com.personal.workspace.repository.DriveLinkRepository;
import com.personal.workspace.repository.FolderRepository;
import com.personal.workspace.repository.NoteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FolderService {

    private static final Logger log = LoggerFactory.getLogger(FolderService.class);

    private final FolderRepository folderRepository;
    private final DocumentRepository documentRepository;
    private final NoteRepository noteRepository;
    private final DriveLinkRepository driveLinkRepository;
    private final CategoryRepository categoryRepository;

    public FolderService(FolderRepository folderRepository,
                         DocumentRepository documentRepository,
                         NoteRepository noteRepository,
                         DriveLinkRepository driveLinkRepository,
                         CategoryRepository categoryRepository) {
        this.folderRepository = folderRepository;
        this.documentRepository = documentRepository;
        this.noteRepository = noteRepository;
        this.driveLinkRepository = driveLinkRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<FolderDTO> getFolders(UUID userId, String type, UUID parentId) {
        String resolvedType = (type != null && !type.isBlank()) ? type.toUpperCase() : "DOCUMENT";
        List<FolderEntity> entities;
        if (parentId == null) {
            entities = folderRepository.findByUserIdAndTypeAndParentIdIsNullOrderByPositionAscNameAsc(userId, resolvedType);
        } else {
            entities = folderRepository.findByUserIdAndParentIdOrderByPositionAscNameAsc(userId, parentId);
        }
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<FolderDTO> getFolderTree(UUID userId, String type) {
        String resolvedType = (type != null && !type.isBlank()) ? type.toUpperCase() : "DOCUMENT";
        List<FolderEntity> allFolders = folderRepository.findByUserIdAndTypeOrderByPositionAscNameAsc(userId, resolvedType);
        
        Map<UUID, FolderDTO> dtoMap = new HashMap<>();
        for (FolderEntity fe : allFolders) {
            dtoMap.put(fe.getId(), mapToDTO(fe));
        }

        List<FolderDTO> rootFolders = new ArrayList<>();
        for (FolderEntity fe : allFolders) {
            FolderDTO current = dtoMap.get(fe.getId());
            if (fe.getParentId() == null) {
                rootFolders.add(current);
            } else {
                FolderDTO parent = dtoMap.get(fe.getParentId());
                if (parent != null) {
                    parent.getChildren().add(current);
                } else {
                    rootFolders.add(current);
                }
            }
        }
        return rootFolders;
    }

    public List<FolderDTO> getBreadcrumbs(UUID userId, UUID folderId) {
        List<FolderDTO> breadcrumbs = new ArrayList<>();
        UUID currentId = folderId;

        while (currentId != null) {
            Optional<FolderEntity> opt = folderRepository.findByIdAndUserId(currentId, userId);
            if (opt.isEmpty()) break;
            FolderEntity f = opt.get();
            breadcrumbs.add(0, mapToDTO(f));
            currentId = f.getParentId();
        }
        return breadcrumbs;
    }

    public FolderDTO getFolderById(UUID userId, UUID id) {
        FolderEntity entity = folderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found with id: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public FolderDTO createFolder(UUID userId, FolderRequest request) {
        if (request.getParentId() != null) {
            folderRepository.findByIdAndUserId(request.getParentId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent folder not found with id: " + request.getParentId()));
        }

        String type = (request.getType() != null && !request.getType().isBlank()) ? request.getType().toUpperCase() : "DOCUMENT";
        FolderEntity folder = new FolderEntity(
                userId,
                request.getParentId(),
                request.getName().trim(),
                type,
                request.getColor(),
                request.getIcon()
        );

        if (request.getCategoryId() != null) {
            folder.setCategoryId(request.getCategoryId());
        }

        FolderEntity saved = folderRepository.save(folder);
        log.info("Created folder '{}' (id: {}) for user {}", saved.getName(), saved.getId(), userId);
        return mapToDTO(saved);
    }

    @Transactional
    public FolderDTO updateFolder(UUID userId, UUID id, FolderRequest request) {
        FolderEntity folder = folderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            folder.setName(request.getName().trim());
        }
        if (request.getColor() != null && !request.getColor().isBlank()) {
            folder.setColor(request.getColor());
        }
        if (request.getIcon() != null && !request.getIcon().isBlank()) {
            folder.setIcon(request.getIcon());
        }
        if (request.getCategoryId() != null) {
            folder.setCategoryId(request.getCategoryId());
        }
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new IllegalArgumentException("A folder cannot be its own parent");
            }
            folderRepository.findByIdAndUserId(request.getParentId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Target parent folder not found with id: " + request.getParentId()));
            folder.setParentId(request.getParentId());
        }

        FolderEntity updated = folderRepository.save(folder);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteFolder(UUID userId, UUID id) {
        FolderEntity folder = folderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found with id: " + id));

        // Delete children recursively
        deleteFolderRecursive(userId, folder);
    }

    private void deleteFolderRecursive(UUID userId, FolderEntity folder) {
        List<FolderEntity> children = folderRepository.findByUserIdAndParentIdOrderByPositionAscNameAsc(userId, folder.getId());
        for (FolderEntity child : children) {
            deleteFolderRecursive(userId, child);
        }
        folderRepository.delete(folder);
        log.info("Deleted folder '{}' (id: {}) for user {}", folder.getName(), folder.getId(), userId);
    }

    public FolderDTO mapToDTO(FolderEntity entity) {
        FolderDTO dto = new FolderDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setParentId(entity.getParentId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setColor(entity.getColor());
        dto.setIcon(entity.getIcon());
        dto.setPosition(entity.getPosition());
        dto.setCategoryId(entity.getCategoryId());
        if (entity.getCategoryId() != null) {
            categoryRepository.findById(entity.getCategoryId()).ifPresent(cat -> {
                dto.setCategoryName(cat.getName());
                dto.setCategoryColor(cat.getColor());
            });
        }
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        // Count sub-folders
        dto.setSubFolderCount(folderRepository.countByUserIdAndParentId(entity.getUserId(), entity.getId()));

        // Count items inside
        if ("DOCUMENT".equalsIgnoreCase(entity.getType())) {
            dto.setItemCount(documentRepository.countByUserIdAndFolderId(entity.getUserId(), entity.getId()));
        } else if ("NOTE".equalsIgnoreCase(entity.getType())) {
            dto.setItemCount(noteRepository.countByUserIdAndFolderId(entity.getUserId(), entity.getId()));
        } else if ("DRIVE".equalsIgnoreCase(entity.getType())) {
            dto.setItemCount(driveLinkRepository.countByUserIdAndFolderId(entity.getUserId(), entity.getId()));
        }

        return dto;
    }
}
