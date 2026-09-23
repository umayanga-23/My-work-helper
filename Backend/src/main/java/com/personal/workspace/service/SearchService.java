package com.personal.workspace.service;

import com.personal.workspace.dto.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SearchService {

    private final TaskService taskService;
    private final NoteService noteService;
    private final DocumentService documentService;
    private final WebsiteService websiteService;
    private final DriveLinkService driveLinkService;
    private final ProjectService projectService;
    private final IdeaService ideaService;

    public SearchService(TaskService taskService,
                         NoteService noteService,
                         DocumentService documentService,
                         WebsiteService websiteService,
                         DriveLinkService driveLinkService,
                         ProjectService projectService,
                         IdeaService ideaService) {
        this.taskService = taskService;
        this.noteService = noteService;
        this.documentService = documentService;
        this.websiteService = websiteService;
        this.driveLinkService = driveLinkService;
        this.projectService = projectService;
        this.ideaService = ideaService;
    }

    public List<SearchResultDTO> searchAll(UUID userId, String query) {
        List<SearchResultDTO> results = new ArrayList<>();
        if (query == null || query.trim().isEmpty()) {
            return results;
        }

        String q = query.trim();

        // 1. Search Tasks
        List<TaskDTO> tasks = taskService.getTasks(userId, null, null, null, q);
        for (TaskDTO t : tasks) {
            results.add(new SearchResultDTO(t.getId(), t.getTitle(), t.getDescription(), "TASK", "/tasks"));
        }

        // 2. Search Notes
        List<NoteDTO> notes = noteService.getNotes(userId, null, null, null, null, q);
        for (NoteDTO n : notes) {
            results.add(new SearchResultDTO(n.getId(), n.getTitle(), n.getContent(), "NOTE", "/notes"));
        }

        // 3. Search Websites
        List<WebsiteDTO> websites = websiteService.getWebsites(userId, null, null, q);
        for (WebsiteDTO w : websites) {
            results.add(new SearchResultDTO(w.getId(), w.getName(), w.getUrl(), "WEBSITE", "/websites"));
        }

        // 4. Search Documents
        List<DocumentDTO> docs = documentService.getDocuments(userId, null, null, q);
        for (DocumentDTO d : docs) {
            results.add(new SearchResultDTO(d.getId(), d.getName(), d.getOriginalFileName(), "DOCUMENT", "/documents"));
        }

        // 5. Search Drive Links
        List<DriveLinkDTO> driveLinks = driveLinkService.getDriveLinks(userId, null, null, null, q);
        for (DriveLinkDTO dl : driveLinks) {
            results.add(new SearchResultDTO(dl.getId(), dl.getName(), dl.getUrl(), "DRIVE_LINK", "/drive"));
        }

        // 6. Search Projects
        List<ProjectDTO> projects = projectService.getProjects(userId, null, q);
        for (ProjectDTO p : projects) {
            results.add(new SearchResultDTO(p.getId(), p.getName(), p.getDescription(), "PROJECT", "/projects"));
        }

        // 7. Search Ideas
        List<IdeaDTO> ideas = ideaService.getIdeas(userId, null, q);
        for (IdeaDTO i : ideas) {
            results.add(new SearchResultDTO(i.getId(), i.getTitle(), i.getDescription(), "IDEA", "/ideas"));
        }

        return results;
    }
}
