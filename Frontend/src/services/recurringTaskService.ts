import { api } from './api';
import type { RecurringTask, RecurringTaskRequest } from '../types';

export const recurringTaskService = {
  async getRecurringTasks(): Promise<RecurringTask[]> {
    try {
      const response = await api.get('/recurring-tasks');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch recurring tasks:', error);
      throw error;
    }
  },

  async getRecurringTaskById(id: string): Promise<RecurringTask> {
    try {
      const response = await api.get(`/recurring-tasks/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch recurring task ${id}:`, error);
      throw error;
    }
  },

  async createRecurringTask(data: RecurringTaskRequest): Promise<RecurringTask> {
    try {
      const response = await api.post('/recurring-tasks', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create recurring task:', error);
      throw error;
    }
  },

  async updateRecurringTask(id: string, data: Partial<RecurringTaskRequest>): Promise<RecurringTask> {
    try {
      const response = await api.put(`/recurring-tasks/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update recurring task ${id}:`, error);
      throw error;
    }
  },

  async deleteRecurringTask(id: string): Promise<void> {
    try {
      await api.delete(`/recurring-tasks/${id}`);
    } catch (error) {
      console.error(`Failed to delete recurring task ${id}:`, error);
      throw error;
    }
  },

  async pauseRecurringTask(id: string): Promise<RecurringTask> {
    try {
      const response = await api.post(`/recurring-tasks/${id}/pause`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to pause recurring task ${id}:`, error);
      throw error;
    }
  },

  async resumeRecurringTask(id: string): Promise<RecurringTask> {
    try {
      const response = await api.post(`/recurring-tasks/${id}/resume`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to resume recurring task ${id}:`, error);
      throw error;
    }
  },

  async triggerGenerateToday(date?: string): Promise<any> {
    const response = await api.post('/recurring-tasks/generate-today', null, {
      params: { date }
    });
    return response.data.data;
  },

  async generateTodayInstances(date?: string): Promise<any> {
    const response = await api.post('/recurring-tasks/generate-today', null, {
      params: { date }
    });
    return response.data.data;
  }
};
