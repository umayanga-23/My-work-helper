import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';

import { HomeDashboard } from './pages/HomeDashboard';
import { TasksPage } from './pages/TasksPage';
import { WebsitesPage } from './pages/WebsitesPage';
import { NotesPage } from './pages/NotesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DriveLinksPage } from './pages/DriveLinksPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { IdeasPage } from './pages/IdeasPage';
import { VaultPage } from './pages/VaultPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <ErrorBoundary fallbackTitle="AIU Workspace View Recovered">
      <ThemeProvider>
        <AuthProvider>
          <ConfirmDialogProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomeDashboard />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/websites" element={<WebsitesPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/drive" element={<DriveLinksPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/ideas" element={<IdeasPage />} />
                  <Route path="/vault" element={<VaultPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin/dashboard" element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ConfirmDialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
