package com.personal.workspace.service;

import com.personal.workspace.dto.DashboardCardDTO;
import com.personal.workspace.dto.DashboardCardRequest;
import com.personal.workspace.entity.CardType;
import com.personal.workspace.entity.DashboardCardEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.DashboardCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DashboardCardService {

    private final DashboardCardRepository dashboardCardRepository;

    public DashboardCardService(DashboardCardRepository dashboardCardRepository) {
        this.dashboardCardRepository = dashboardCardRepository;
    }

    public List<DashboardCardDTO> getDashboardCards(UUID userId) {
        List<DashboardCardEntity> entities = dashboardCardRepository.findByUserIdAndIsVisibleTrueOrderByPositionAsc(userId);
        if (entities.isEmpty()) {
            entities = seedDefaultCards(userId);
        }
        return entities.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public DashboardCardDTO createCard(UUID userId, DashboardCardRequest request) {
        DashboardCardEntity card = new DashboardCardEntity();
        card.setUserId(userId);
        card.setTitle(request.getTitle().trim());
        card.setDescription(request.getDescription());
        card.setIcon(request.getIcon() != null ? request.getIcon() : "Sparkles");
        card.setColor(request.getColor() != null ? request.getColor() : "#0c93e7");
        card.setType(request.getType());
        card.setConfig(request.getConfig());
        card.setPosition(request.getPosition() != null ? request.getPosition() : 0);
        card.setVisible(request.getIsVisible() != null ? request.getIsVisible() : true);

        DashboardCardEntity saved = dashboardCardRepository.save(card);
        return mapToDTO(saved);
    }

    @Transactional
    public DashboardCardDTO updateCard(UUID userId, UUID id, DashboardCardRequest request) {
        DashboardCardEntity card = dashboardCardRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard card not found with id: " + id));

        card.setTitle(request.getTitle().trim());
        card.setDescription(request.getDescription());
        if (request.getIcon() != null) card.setIcon(request.getIcon());
        if (request.getColor() != null) card.setColor(request.getColor());
        if (request.getType() != null) card.setType(request.getType());
        card.setConfig(request.getConfig());
        if (request.getPosition() != null) card.setPosition(request.getPosition());
        if (request.getIsVisible() != null) card.setVisible(request.getIsVisible());

        DashboardCardEntity updated = dashboardCardRepository.save(card);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCard(UUID userId, UUID id) {
        DashboardCardEntity card = dashboardCardRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Dashboard card not found with id: " + id));
        dashboardCardRepository.delete(card);
    }

    private List<DashboardCardEntity> seedDefaultCards(UUID userId) {
        DashboardCardEntity c1 = new DashboardCardEntity();
        c1.setUserId(userId); c1.setTitle("Important Websites"); c1.setDescription("Favorite developer bookmarks"); c1.setIcon("Globe"); c1.setColor("#3b82f6"); c1.setType(CardType.WEBSITE_COLLECTION); c1.setPosition(1);

        DashboardCardEntity c2 = new DashboardCardEntity();
        c2.setUserId(userId); c2.setTitle("Engineering Notes"); c2.setDescription("Key architectural references"); c2.setIcon("FileText"); c2.setColor("#f59e0b"); c2.setType(CardType.NOTES_COLLECTION); c2.setPosition(2);

        DashboardCardEntity c3 = new DashboardCardEntity();
        c3.setUserId(userId); c3.setTitle("Project Documents"); c3.setDescription("Storage PDFs & diagrams"); c3.setIcon("FolderArchive"); c3.setColor("#6366f1"); c3.setType(CardType.DOCUMENTS); c3.setPosition(3);

        return dashboardCardRepository.saveAll(Arrays.asList(c1, c2, c3));
    }

    private DashboardCardDTO mapToDTO(DashboardCardEntity entity) {
        DashboardCardDTO dto = new DashboardCardDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setIcon(entity.getIcon());
        dto.setColor(entity.getColor());
        dto.setType(entity.getType());
        dto.setConfig(entity.getConfig());
        dto.setPosition(entity.getPosition());
        dto.setVisible(entity.isVisible());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
