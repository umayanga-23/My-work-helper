import { api } from './api';
import type { GlobalSearchResult } from '../types';

export const searchService = {
  async searchAll(query: string): Promise<GlobalSearchResult[]> {
    if (!query.trim()) return [];
    try {
      const response = await api.get('/search', { params: { q: query } });
      return response.data.data || [];
    } catch (error) {
      console.error('Search request failed:', error);
      return [];
    }
  }
};
