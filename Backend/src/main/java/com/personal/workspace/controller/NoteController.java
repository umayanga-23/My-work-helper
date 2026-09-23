package com.personal.workspace.controller;

import com.personal.workspace.dto.ApiResponse;
import com.personal.workspace.dto.NoteDTO;
import com.personal.workspace.dto.NoteRequest;
import com.personal.workspace.security.UserPrincipal;
import com.personal.workspace.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getNotes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Boolean isFavorite,
            @RequestParam(required = false) Boolean isArchived,
            @RequestParam(required = false) String search) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        List<NoteDTO> notes = noteService.getNotes(userId, categoryId, projectId, isFavorite, isArchived, search);
        return ResponseEntity.ok(ApiResponse.success(notes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteDTO>> getNoteById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        NoteDTO note = noteService.getNoteById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(note));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NoteDTO>> createNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody NoteRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        NoteDTO created = noteService.createNote(userId, request);
        return new ResponseEntity<>(ApiResponse.success("Note created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteDTO>> updateNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody NoteRequest request) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        NoteDTO updated = noteService.updateNote(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Note updated successfully", updated));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<NoteDTO>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        NoteDTO updated = noteService.toggleFavorite(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Note favorite state toggled", updated));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<NoteDTO>> toggleArchive(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        NoteDTO updated = noteService.toggleArchive(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Note archive state toggled", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        UUID userId = principal != null ? principal.getId() : DEMO_USER_ID;
        noteService.deleteNote(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Note deleted successfully", null));
    }
}
