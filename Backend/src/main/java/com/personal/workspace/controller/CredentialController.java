package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.CredentialDTO;
import com.personal.workspace.dto.CredentialRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.CredentialService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/credentials")
public class CredentialController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CredentialDTO>>> getCredentials(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<CredentialDTO> credentials = credentialService.getCredentials(userId);
        return ResponseEntity.ok(ApiResponse.success("Credentials retrieved successfully", credentials));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CredentialDTO>> createCredential(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CredentialRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        CredentialDTO created = credentialService.createCredential(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Credential created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CredentialDTO>> updateCredential(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody CredentialRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        CredentialDTO updated = credentialService.updateCredential(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Credential updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCredential(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        credentialService.deleteCredential(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Credential deleted successfully", null));
    }
}
