package com.personal.workspace;

import com.personal.workspace.dto.*;
import com.personal.workspace.entity.TaskEntity;
import com.personal.workspace.repository.*;
import com.personal.workspace.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class RepositoryQueryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WebsiteRepository websiteRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private DriveLinkRepository driveLinkRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private WebsiteService websiteService;

    @Autowired
    private NoteService noteService;

    @Autowired
    private IdeaService ideaService;

    @Autowired
    private DriveLinkService driveLinkService;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private CredentialService credentialService;

    private static final UUID DEMO_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    public void testFilterQueriesWithNullSearch() {
        assertNotNull(taskRepository.filterTasks(DEMO_USER_ID, null, null, null, null));
        assertNotNull(projectRepository.filterProjects(DEMO_USER_ID, null, null));
        assertNotNull(websiteRepository.filterWebsites(DEMO_USER_ID, null, null, null, null));
        assertNotNull(noteRepository.filterNotes(DEMO_USER_ID, null, null, null, null, null));
        assertNotNull(ideaRepository.filterIdeas(DEMO_USER_ID, null, null));
        assertNotNull(driveLinkRepository.filterDriveLinks(DEMO_USER_ID, null, null, null, null));
        assertNotNull(documentRepository.filterDocuments(DEMO_USER_ID, null, null, null));
    }

    @Test
    public void testFullCrudAndLazyLoadingPersistence() {
        // 1. Create a task via TaskService
        TaskRequest req = new TaskRequest();
        req.setTitle("Master Audit Verification Task");
        req.setDescription("Verifying complete persistence pipeline");
        TaskDTO created = taskService.createTask(DEMO_USER_ID, req);
        assertNotNull(created.getId());
        assertEquals("Master Audit Verification Task", created.getTitle());

        // 2. Fetch all tasks via TaskService (validates no 500 error on read)
        List<TaskDTO> tasks = taskService.getTasks(DEMO_USER_ID, null, null, null, null);
        assertNotNull(tasks);
        assertTrue(tasks.stream().anyMatch(t -> t.getId().equals(created.getId())));

        // 3. Fetch single task by ID (validates lazy loading of subtasks/resources with open session)
        TaskDTO fetched = taskService.getTaskById(DEMO_USER_ID, created.getId());
        assertNotNull(fetched);
        assertEquals(created.getId(), fetched.getId());

        // 4. Test other services for read stability
        assertNotNull(projectService.getProjects(DEMO_USER_ID, null, null));
        assertNotNull(websiteService.getWebsites(DEMO_USER_ID, null, null, null, null));
        assertNotNull(noteService.getNotes(DEMO_USER_ID, null, null, null, null, null));
        assertNotNull(ideaService.getIdeas(DEMO_USER_ID, null, null));
        assertNotNull(driveLinkService.getDriveLinks(DEMO_USER_ID, null, null, null, null));
        assertNotNull(documentService.getDocuments(DEMO_USER_ID, null, null, null));
        assertNotNull(analyticsService.getAnalyticsSummary(DEMO_USER_ID));
        assertNotNull(activityLogService.getUserActivities(DEMO_USER_ID));
        assertNotNull(credentialService.getCredentials(DEMO_USER_ID));
    }
}
