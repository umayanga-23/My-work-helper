import { api } from './api';
import type { AnalyticsSummary } from '../types';

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    try {
      const response = await api.get('/analytics/summary');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        totalNotes: 0,
        totalWebsites: 0,
        totalDocuments: 0,
        totalDriveLinks: 0,
        totalProjects: 0,
        totalSkills: 0,
        totalIdeas: 0,
        tasksByCategory: {},
        tasksByPriority: {},
        weeklyTrends: []
      };
    }
  }
};
