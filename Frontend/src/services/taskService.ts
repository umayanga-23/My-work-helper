import { api } from './api';
import type { Task, TaskStatus, TaskResource, ResourceType, ActivityLog } from '../types';

export const taskService = {
  async getTasks(params?: { status?: TaskStatus; categoryId?: string; projectId?: string; search?: string }): Promise<Task[]> {
    try {
      const response = await api.get('/tasks', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  },

  async getCalendarTasks(startDate?: string, endDate?: string): Promise<Task[]> {
    try {
      const response = await api.get('/tasks/calendar', {
        params: { startDate, endDate }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch calendar tasks:', error);
      throw error;
    }
  },

  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch task ${id}:`, error);
      throw error;
    }
  },

  async getTodayTasks(): Promise<Task[]> {
    try {
      const response = await api.get('/tasks/today');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch today tasks:', error);
      throw error;
    }
  },

  async getTodaySummary(): Promise<any> {
    try {
      const response = await api.get('/tasks/summary/today');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch today summary:', error);
      return null;
    }
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    try {
      const response = await api.post('/tasks', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  async createSubtask(parentTaskId: string, data: Partial<Task>): Promise<Task> {
    try {
      const response = await api.post(`/tasks/${parentTaskId}/subtasks`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to create subtask for ${parentTaskId}:`, error);
      throw error;
    }
  },

  async getOverdueTasks(): Promise<Task[]> {
    try {
      const response = await api.get('/tasks/overdue');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch overdue tasks:', error);
      throw error;
    }
  },

  async rescheduleToToday(id: string): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${id}/reschedule-today`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to reschedule task ${id} to today:`, error);
      throw error;
    }
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update task ${id}:`, error);
      throw error;
    }
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${id}/status`, null, { params: { status } });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update status for task ${id}:`, error);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`);
    } catch (error) {
      console.error(`Failed to delete task ${id}:`, error);
      throw error;
    }
  },

  async addResource(taskId: string, resourceType: ResourceType, resourceId: string): Promise<TaskResource> {
    try {
      const response = await api.post(`/tasks/${taskId}/resources`, null, {
        params: { resourceType, resourceId }
      });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to add resource to task ${taskId}:`, error);
      throw error;
    }
  },

  async removeResource(taskId: string, resourceLinkId: string): Promise<void> {
    try {
      await api.delete(`/tasks/${taskId}/resources/${resourceLinkId}`);
    } catch (error) {
      console.error(`Failed to remove resource link ${resourceLinkId} from task ${taskId}:`, error);
      throw error;
    }
  },

  // ── Dependency management ─────────────────────────────────────────────────
  async addDependency(taskId: string, dependsOnId: string): Promise<void> {
    try {
      await api.post(`/tasks/${taskId}/dependencies`, null, { params: { dependsOnId } });
    } catch (error) {
      console.error(`Failed to add dependency ${dependsOnId} to task ${taskId}:`, error);
      throw error;
    }
  },

  async removeDependency(taskId: string, dependsOnId: string): Promise<void> {
    try {
      await api.delete(`/tasks/${taskId}/dependencies/${dependsOnId}`);
    } catch (error) {
      console.error(`Failed to remove dependency ${dependsOnId} from task ${taskId}:`, error);
      throw error;
    }
  },

  // ── Task activity log ─────────────────────────────────────────────────────
  async getTaskActivity(taskId: string): Promise<ActivityLog[]> {
    try {
      const response = await api.get(`/tasks/${taskId}/activity`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch activity for task ${taskId}:`, error);
      return [];
    }
  }
};
