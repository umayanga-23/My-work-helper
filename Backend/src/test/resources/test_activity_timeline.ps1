$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PROJECT ACTIVITY TIMELINE E2E VERIFICATION" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Register / Login test user
$userEmail = "timeline_tester_" + (Get-Random) + "@test.com"
$regBody = @{
    name = "Timeline Tester"
    email = $userEmail
    password = "Password123!"
} | ConvertTo-Json

Write-Host "`n1. Registering test user..." -ForegroundColor Yellow
$regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -Headers $headers
$token = $regRes.data.token
$authHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}
Write-Host "✓ User registered and authenticated" -ForegroundColor Green

# 2. Create a fresh project
Write-Host "`n2. Creating a test project..." -ForegroundColor Yellow
$projBody = @{
    name = "Activity Timeline Test Project"
    description = "Testing chronological activity stream"
    status = "ACTIVE"
    githubRepo = "facebook/react"
    startDate = "2026-09-01"
    endDate = "2026-10-01"
} | ConvertTo-Json

$projRes = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projBody -Headers $authHeaders
$projectId = $projRes.data.id
Write-Host "✓ Project created with ID: $projectId" -ForegroundColor Green

# 3. Create a task in this project
Write-Host "`n3. Creating a task in the project..." -ForegroundColor Yellow
$taskBody = @{
    title = "Implement JWT validation"
    description = "Add secure token verification"
    priority = "HIGH"
    status = "IN_PROGRESS"
    projectId = $projectId
} | ConvertTo-Json

$taskRes = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $authHeaders
$taskId = $taskRes.data.id
Write-Host "✓ Task created: '$($taskRes.data.title)' with ID: $taskId" -ForegroundColor Green

# 4. Complete the task
Write-Host "`n4. Completing the task..." -ForegroundColor Yellow
$completeBody = @{
    status = "COMPLETED"
} | ConvertTo-Json

$updateTaskRes = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Put -Body $completeBody -Headers $authHeaders
Write-Host "✓ Task updated to COMPLETED" -ForegroundColor Green

# 5. Add a Note in this project
Write-Host "`n5. Creating a note in the project..." -ForegroundColor Yellow
$noteBody = @{
    title = "Authentication Architecture"
    content = "Detailed diagrams and flows"
    projectId = $projectId
} | ConvertTo-Json

$noteRes = Invoke-RestMethod -Uri "$baseUrl/notes" -Method Post -Body $noteBody -Headers $authHeaders
$noteId = $noteRes.data.id
Write-Host "✓ Note created: '$($noteRes.data.title)'" -ForegroundColor Green

# 6. Update the Note
Write-Host "`n6. Updating the note..." -ForegroundColor Yellow
$updateNoteBody = @{
    title = "Authentication Architecture v2"
    content = "Added OAuth2 specification"
    projectId = $projectId
} | ConvertTo-Json

$upNoteRes = Invoke-RestMethod -Uri "$baseUrl/notes/$noteId" -Method Put -Body $updateNoteBody -Headers $authHeaders
Write-Host "✓ Note updated: '$($upNoteRes.data.title)'" -ForegroundColor Green

# 7. Add a Document in this project
Write-Host "`n7. Creating a document in the project..." -ForegroundColor Yellow
$docBody = @{
    title = "API Specification v2"
    fileType = "DOCUMENT"
    fileName = "api-spec-v2.pdf"
    fileSize = 2048576
    projectId = $projectId
} | ConvertTo-Json

$docRes = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Post -Body $docBody -Headers $authHeaders
$docId = $docRes.data.id
Write-Host "✓ Document created: '$($docRes.data.title)'" -ForegroundColor Green

# 8. Add a Website bookmark in this project
Write-Host "`n8. Adding a website in the project..." -ForegroundColor Yellow
$webBody = @{
    title = "Spring Security Documentation"
    url = "https://spring.io/projects/spring-security"
    projectId = $projectId
} | ConvertTo-Json

$webRes = Invoke-RestMethod -Uri "$baseUrl/websites" -Method Post -Body $webBody -Headers $authHeaders
$webId = $webRes.data.id
Write-Host "✓ Website added: '$($webRes.data.title)'" -ForegroundColor Green

# 9. Add a Google Drive link in this project
Write-Host "`n9. Adding a Drive resource in the project..." -ForegroundColor Yellow
$driveBody = @{
    title = "Project Roadmap Sheet"
    url = "https://docs.google.com/spreadsheets/d/12345"
    resourceType = "SHEET"
    projectId = $projectId
} | ConvertTo-Json

$driveRes = Invoke-RestMethod -Uri "$baseUrl/drive" -Method Post -Body $driveBody -Headers $authHeaders
$driveId = $driveRes.data.id
Write-Host "✓ Drive resource added: '$($driveRes.data.title)'" -ForegroundColor Green

# 10. Create and Complete a Milestone
Write-Host "`n10. Creating and completing a Milestone..." -ForegroundColor Yellow
$msBody = @{
    title = "Sprint 1 MVP Launch"
    description = "Complete core auth and workspace features"
    status = "OPEN"
    dueDate = "2026-09-25"
} | ConvertTo-Json

$msRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/milestones" -Method Post -Body $msBody -Headers $authHeaders
$msId = $msRes.data.id

$msCompleteBody = @{
    title = "Sprint 1 MVP Launch"
    description = "Complete core auth and workspace features"
    status = "COMPLETED"
    dueDate = "2026-09-25"
} | ConvertTo-Json

$msUpRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/milestones/$msId" -Method Put -Body $msCompleteBody -Headers $authHeaders
Write-Host "✓ Milestone created and completed" -ForegroundColor Green

# 11. Fetch Project Activities from /api/projects/{id}/activity
Write-Host "`n11. Verifying GET /api/projects/$projectId/activity..." -ForegroundColor Yellow
$actRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/activity" -Method Get -Headers $authHeaders
$activities = $actRes.data

Write-Host "Found $($activities.Count) logged project activities:" -ForegroundColor Cyan
foreach ($act in $activities) {
    Write-Host "  [$($act.createdAt)] - $($act.action) ($($act.entityType)) -> $($act.metadata)" -ForegroundColor Gray
}

# 12. Fetch Project Workspace and verify activity persistence
Write-Host "`n12. Verifying GET /api/projects/$projectId/workspace payload..." -ForegroundColor Yellow
$wsRes = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/workspace" -Method Get -Headers $authHeaders
$wsActivities = $wsRes.data.activity
Write-Host "Workspace payload contains $($wsActivities.Count) activities" -ForegroundColor Cyan

# 13. Assert required events
$actions = $activities | ForEach-Object { $_.action }

$expected = @(
    "Project created",
    "GitHub repository connected",
    "Task created",
    "Task completed",
    "Note added",
    "Note updated",
    "Document added",
    "Website added",
    "Drive resource added",
    "Milestone completed"
)

$allPassed = $true
foreach ($exp in $expected) {
    if ($actions -contains $exp) {
        Write-Host "  ✓ Verified event: '$exp'" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing event: '$exp'" -ForegroundColor Red
        $allPassed = $false
    }
}

# 14. Check Chronological Order (Newest First)
Write-Host "`n14. Verifying Chronological Descending Order..." -ForegroundColor Yellow
$isChronological = $true
for ($i = 0; $i -lt ($activities.Count - 1); $i++) {
    $curr = [DateTime]::Parse($activities[$i].createdAt)
    $next = [DateTime]::Parse($activities[$i + 1].createdAt)
    if ($curr -lt $next) {
        $isChronological = $false
        Write-Host "  ✗ Out of order: $($activities[$i].action) ($curr) is older than $($activities[$i+1].action) ($next)" -ForegroundColor Red
        break
    }
}

if ($isChronological) {
    Write-Host "  ✓ All $($activities.Count) events are strictly in chronological descending order (newest first)" -ForegroundColor Green
}

if ($allPassed -and $isChronological) {
    Write-Host "`n=======================================================" -ForegroundColor Green
    Write-Host "ALL PROJECT ACTIVITY TIMELINE VERIFICATIONS PASSED 100%" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
} else {
    Write-Host "`nSome verifications failed!" -ForegroundColor Red
    exit 1
}
