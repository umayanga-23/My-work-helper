# DocuSphere — Personal Work & Knowledge Management System

DocuSphere is a production-grade, highly interconnected Personal Work & Knowledge Management System built specifically for software engineering and IT students. It provides a centralized, private workspace that links Tasks, Notes, Documents, Websites, Google Drive Links, Projects, Skill Matrices, Ideas, Password Credentials, Productivity Analytics, and Dynamic Dashboard Cards into a unified dashboard experience.

---

## Architecture & System Overview

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend**: Java 17 + Spring Boot 3 + Spring Data JPA + Spring Security (Stateless JWT Filter Chain).
- **Database**: Supabase PostgreSQL (16 tables: `users`, `categories`, `tasks`, `task_resources`, `notes`, `websites`, `documents`, `drive_links`, `projects`, `skills`, `learning_topics`, `ideas`, `dashboard_cards`, `credentials`, `activity_logs`, `user_settings`).
- **File Storage**: Supabase Storage file uploads with 50MB drag-and-drop validation and signed download URLs.
- **Zero-Trust Security**: Client-side Web Crypto API (**AES-256-GCM** key derivation using **PBKDF2** with 100,000 iterations + salt). Plaintext passwords never touch backend servers.

---

## Core Capabilities & Feature Phases

1. **Today's Focus Dashboard**: Real-time task progress bar, metrics overview, priority badges, and quick launcher cards.
2. **Tasks Manager**: Filterable task list (All, Today, In Progress, Completed), category tags, priority levels (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), due times, and project linking.
3. **Website Manager**: URL bookmark manager featuring automatic Google Favicon Discovery API (`https://www.google.com/s2/favicons?domain=...&sz=64`), category tags, and favorite toggles.
4. **Notes & Knowledge Base**: Markdown editor with live preview, grid/list view modes, markdown tag search, favorite toggling, and full note reader modal.
5. **Document Vault**: Supabase Storage file uploads with file type icons, size formatting, and signed download URLs.
6. **Google Drive Links Repository**: Category filtering, search, favorite toggling, and project linking.
7. **Projects & Unified Workspace**: Status pipelines (`PLANNING`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`), auto-calculated completion rates, and tabbed workspace per project (Overview, Tasks, Notes, Documents, Websites, Drive).
8. **Learning & Skill Management**: Skill matrix, percentage metrics, technology topic checklists, and auto-calculated skill proficiency scores.
9. **Ideas Vault**: Idea status pipelines (`IDEA`, `EXPLORING`, `PLANNED`, `CONVERTED_TO_PROJECT`, `ARCHIVED`) and **Convert Idea to Project** business logic.
10. **Custom Dashboard Cards**: Dynamic Home Dashboard widget cards with color presets and type routing.
11. **Global Search Engine**: Cross-entity search (`Ctrl+K` / `Cmd+K`) querying Tasks, Notes, Websites, Documents, Drive Links, Projects, and Ideas.
12. **Productivity Analytics Engine**: Real-time task completion statistics, 7-day trend chart, and workspace knowledge inventory.
13. **System Activity & Audit Trail**: Chronological event log with action node indicators and metadata payload view.
14. **Zero-Trust Password Vault**: AES-256-GCM client-side encryption, Master Password unlock, session lock, auto-clearing clipboard copy, and built-in password generator.
15. **System Admin & Health Dashboard**: Live server telemetry, JVM memory meter, host environment specs, and PostgreSQL row count grid.

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: v20+
- **Java**: OpenJDK 17 / Java 17
- **Maven**: Bundled Maven wrapper (`.\mvnw.cmd` / `./mvnw`)

### 1. Environment Configuration

#### Backend Configuration (`Backend/src/main/resources/application.yml`):
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:docusphere}
    username: ${DB_USER:postgres}
    password: ${DB_PASS:postgres}
  jpa:
    hibernate:
      ddl-auto: update
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration-ms: 86400000

supabase:
  url: ${SUPABASE_URL:https://your-supabase-project.supabase.co}
  service-role-key: ${SUPABASE_SERVICE_ROLE_KEY:your-service-role-key}
  bucket: ${SUPABASE_STORAGE_BUCKET:documents}
```

#### Frontend Configuration (`Frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

### 2. Running Locally

#### Start Backend (Spring Boot 3):
```powershell
cd Backend
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
.\mvnw.cmd spring-boot:run
```

#### Start Frontend (React + Vite):
```powershell
cd Frontend
npm run dev
```
Navigate to `http://localhost:5173`.

---

## License & Copyright
Developed for personal work, knowledge management, and software engineering productivity. All rights reserved.
