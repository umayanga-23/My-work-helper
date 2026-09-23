import { api } from './api';
import type { Category, CategoryType } from '../types';

export const categoryService = {
  async getCategories(type?: CategoryType): Promise<Category[]> {
    try {
      const response = await api.get('/categories', { params: { type } });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await api.post('/categories', data);
    window.dispatchEvent(new CustomEvent('workspace-category-updated', { detail: { action: 'create', data: response.data.data } }));
    return response.data.data;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    window.dispatchEvent(new CustomEvent('workspace-category-updated', { detail: { action: 'update', id, data: response.data.data } }));
    return response.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
    window.dispatchEvent(new CustomEvent('workspace-category-updated', { detail: { action: 'delete', id } }));
  }
};
