package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.CredentialDTO;
import com.personal.workspace.dto.CredentialRequest;
import com.personal.workspace.service.CredentialService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/credentials")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CredentialDTO>>> getCredentials(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<CredentialDTO> credentials = credentialService.getCredentials(userId);
        return ResponseEntity.ok(ApiResponse.success("Credentials retrieved successfully", credentials));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CredentialDTO>> createCredential(
            Authentication authentication,
            @Valid @RequestBody CredentialRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        CredentialDTO created = credentialService.createCredential(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Credential created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CredentialDTO>> updateCredential(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody CredentialRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        CredentialDTO updated = credentialService.updateCredential(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Credential updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCredential(
            Authentication authentication,
            @PathVariable UUID id) {
        UUID userId = UUID.fromString(authentication.getName());
        credentialService.deleteCredential(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Credential deleted successfully", null));
    }
}
