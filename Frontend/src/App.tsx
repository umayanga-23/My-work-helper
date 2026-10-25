import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';

// Direct import for HomeDashboard to render instantly on first load
import { HomeDashboard } from './pages/HomeDashboard';

// Lazy-loaded routes for 80%+ bundle reduction on initial load
const TasksPage = React.lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const GoalsPage = React.lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const WebsitesPage = React.lazy(() => import('./pages/WebsitesPage').then((m) => ({ default: m.WebsitesPage })));
const NotesPage = React.lazy(() => import('./pages/NotesPage').then((m) => ({ default: m.NotesPage })));
const DocumentsPage = React.lazy(() => import('./pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const DriveLinksPage = React.lazy(() => import('./pages/DriveLinksPage').then((m) => ({ default: m.DriveLinksPage })));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const IdeasPage = React.lazy(() => import('./pages/IdeasPage').then((m) => ({ default: m.IdeasPage })));
const VaultPage = React.lazy(() => import('./pages/VaultPage').then((m) => ({ default: m.VaultPage })));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-[#8A9890] dark:text-[#6F8A7A]">Loading workspace...</span>
    </div>
  </div>
);

export function App() {
  return (
    <ErrorBoundary fallbackTitle="AIU Workspace View Recovered">
      <ThemeProvider>
        <AuthProvider>
          <ConfirmDialogProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<HomeDashboard />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
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
              </Suspense>
            </BrowserRouter>
          </ConfirmDialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
