import { api } from './api';
import type { Idea, IdeaStatus, Project } from '../types';

export const ideaService = {
  async getIdeas(params?: { status?: IdeaStatus; search?: string }): Promise<Idea[]> {
    try {
      const response = await api.get('/ideas', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
      throw error;
    }
  },

  async createIdea(data: Partial<Idea>): Promise<Idea> {
    try {
      const response = await api.post('/ideas', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create idea:', error);
      throw error;
    }
  },

  async convertToProject(id: string): Promise<Project> {
    try {
      const response = await api.post(`/ideas/${id}/convert-to-project`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to convert idea ${id} to project:`, error);
      throw error;
    }
  },

  async deleteIdea(id: string): Promise<void> {
    try {
      await api.delete(`/ideas/${id}`);
    } catch (error) {
      console.error(`Failed to delete idea ${id}:`, error);
      throw error;
    }
  }
};
