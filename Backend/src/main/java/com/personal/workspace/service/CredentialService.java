package com.personal.workspace.service;

import com.personal.workspace.dto.CredentialDTO;
import com.personal.workspace.dto.CredentialRequest;
import com.personal.workspace.entity.CredentialEntity;
import com.personal.workspace.exception.ResourceNotFoundException;
import com.personal.workspace.repository.CredentialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;

    public CredentialService(CredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    @Transactional(readOnly = true)
    public List<CredentialDTO> getCredentials(UUID userId) {
        return credentialRepository.findByUserIdOrderByServiceNameAsc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CredentialDTO createCredential(UUID userId, CredentialRequest request) {
        CredentialEntity entity = new CredentialEntity();
        entity.setUserId(userId);
        entity.setCategory(request.getCategory());
        entity.setServiceName(request.getServiceName());
        entity.setUsername(request.getUsername());
        entity.setEncryptedPassword(request.getEncryptedPassword());
        entity.setIv(request.getIv());
        entity.setSalt(request.getSalt());
        entity.setUrl(request.getUrl());
        entity.setNotes(request.getNotes());

        CredentialEntity saved = credentialRepository.save(entity);
        return mapToDTO(saved);
    }

    @Transactional
    public CredentialDTO updateCredential(UUID userId, UUID id, CredentialRequest request) {
        CredentialEntity entity = credentialRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Credential not found with id: " + id));

        entity.setCategory(request.getCategory());
        entity.setServiceName(request.getServiceName());
        entity.setUsername(request.getUsername());
        if (request.getEncryptedPassword() != null && !request.getEncryptedPassword().isBlank()) {
            entity.setEncryptedPassword(request.getEncryptedPassword());
            entity.setIv(request.getIv());
            entity.setSalt(request.getSalt());
        }
        entity.setUrl(request.getUrl());
        entity.setNotes(request.getNotes());

        CredentialEntity updated = credentialRepository.save(entity);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCredential(UUID userId, UUID id) {
        CredentialEntity entity = credentialRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Credential not found with id: " + id));
        credentialRepository.delete(entity);
    }

    private CredentialDTO mapToDTO(CredentialEntity entity) {
        CredentialDTO dto = new CredentialDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setCategory(entity.getCategory());
        dto.setServiceName(entity.getServiceName());
        dto.setUsername(entity.getUsername());
        dto.setEncryptedPassword(entity.getEncryptedPassword());
        dto.setIv(entity.getIv());
        dto.setSalt(entity.getSalt());
        dto.setUrl(entity.getUrl());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
