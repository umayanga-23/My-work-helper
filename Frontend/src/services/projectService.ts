import { api } from './api';
import type { Project, ProjectStatus, Task, Note, DocumentItem, Website, DriveLink, ActivityLog } from '../types';

export interface ProjectWorkspacePayload {
  project: Project;
  tasks: Task[];
  notes: Note[];
  documents: DocumentItem[];
  websites: Website[];
  driveLinks: DriveLink[];
  gitCommits?: import('../types').TaskGitCommit[];
  milestones?: import('../types').ProjectMilestone[];
  issues?: import('../types').ProjectIssue[];
  activity?: ActivityLog[];
}

export const projectService = {
  async getProjects(params?: { status?: ProjectStatus; search?: string }): Promise<Project[]> {
    try {
      const response = await api.get('/projects', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  },

  async getProjectWorkspace(id: string): Promise<ProjectWorkspacePayload> {
    try {
      const response = await api.get(`/projects/${id}/workspace`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch project workspace for ${id}:`, error);
      throw error;
    }
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    try {
      const response = await api.post('/projects', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    try {
      const response = await api.put(`/projects/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update project ${id}:`, error);
      throw error;
    }
  },

  async updateProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
    try {
      const response = await api.patch(`/projects/${id}/status`, null, { params: { status } });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update status for project ${id}:`, error);
      throw error;
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      await api.delete(`/projects/${id}`);
    } catch (error) {
      console.error(`Failed to delete project ${id}:`, error);
      throw error;
    }
  },

  async syncProjectGitHub(id: string): Promise<{ syncedCommits: number; tasksUpdated: number; repo: string }> {
    const response = await api.post(`/projects/${id}/github/sync`);
    return response.data;
  },

  async getProjectGitActivity(id: string): Promise<any[]> {
    try {
      const response = await api.get(`/projects/${id}/github/activity`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch git activity for project ${id}:`, error);
      return [];
    }
  },

  async getProjectMilestones(projectId: string): Promise<import('../types').ProjectMilestone[]> {
    const response = await api.get(`/projects/${projectId}/milestones`);
    return response.data.data || [];
  },

  async createProjectMilestone(projectId: string, data: Partial<import('../types').ProjectMilestone>): Promise<import('../types').ProjectMilestone> {
    const response = await api.post(`/projects/${projectId}/milestones`, data);
    return response.data.data;
  },

  async getProjectIssues(projectId: string): Promise<import('../types').ProjectIssue[]> {
    const response = await api.get(`/projects/${projectId}/issues`);
    return response.data.data || [];
  },

  async createProjectIssue(projectId: string, data: Partial<import('../types').ProjectIssue>): Promise<import('../types').ProjectIssue> {
    const response = await api.post(`/projects/${projectId}/issues`, data);
    return response.data.data;
  },

  async linkResourceToProject(projectId: string, resourceType: import('../types').ResourceType, resourceId: string): Promise<void> {
    await api.post(`/projects/${projectId}/link-resource`, null, {
      params: { resourceType, resourceId }
    });
  },

  async unlinkResourceFromProject(projectId: string, resourceType: import('../types').ResourceType, resourceId: string): Promise<void> {
    await api.post(`/projects/${projectId}/unlink-resource`, null, {
      params: { resourceType, resourceId }
    });
  },

  async getProjectActivity(projectId: string): Promise<ActivityLog[]> {
    try {
      const response = await api.get(`/projects/${projectId}/activity`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch project activity:', error);
      return [];
    }
  },

  async updateProjectMilestone(projectId: string, milestoneId: string, data: Partial<import('../types').ProjectMilestone>): Promise<import('../types').ProjectMilestone> {
    const response = await api.put(`/projects/${projectId}/milestones/${milestoneId}`, data);
    return response.data.data;
  },

  async deleteProjectMilestone(projectId: string, milestoneId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
  },

  async updateProjectIssue(projectId: string, issueId: string, data: Partial<import('../types').ProjectIssue>): Promise<import('../types').ProjectIssue> {
    const response = await api.put(`/projects/${projectId}/issues/${issueId}`, data);
    return response.data.data;
  },

  async deleteProjectIssue(projectId: string, issueId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/issues/${issueId}`);
  },

  async sendProjectAiMessage(projectId: string, message: string, conversationHistory: {role: string; content: string}[]): Promise<string> {
    const response = await api.post(`/projects/${projectId}/ai/chat`, {
      message,
      conversationHistory
    });
    return response.data.data?.reply || response.data.data || '';
  }
};
