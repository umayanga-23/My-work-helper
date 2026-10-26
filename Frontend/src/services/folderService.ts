import { api } from './api';
import type { FolderItem } from '../types';

export const folderService = {
  /**
   * Fetch folders for a specific type and optional parentId (sub-folders)
   */
  async getFolders(type: 'DOCUMENT' | 'NOTE' | 'DRIVE' = 'DOCUMENT', parentId?: string): Promise<FolderItem[]> {
    const params: Record<string, string> = { type };
    if (parentId) params.parentId = parentId;
    const response = await api.get('/folders', { params });
    return response.data?.data || [];
  },

  /**
   * Fetch full recursive folder tree
   */
  async getFolderTree(type: 'DOCUMENT' | 'NOTE' | 'DRIVE' = 'DOCUMENT'): Promise<FolderItem[]> {
    const response = await api.get('/folders/tree', { params: { type } });
    return response.data?.data || [];
  },

  /**
   * Fetch single folder
   */
  async getFolderById(id: string): Promise<FolderItem> {
    const response = await api.get(`/folders/${id}`);
    return response.data?.data;
  },

  /**
   * Fetch breadcrumbs path from root down to folder
   */
  async getBreadcrumbs(id: string): Promise<FolderItem[]> {
    const response = await api.get(`/folders/${id}/breadcrumbs`);
    return response.data?.data || [];
  },

  /**
   * Create a new folder (or sub-folder if parentId is provided)
   */
  async createFolder(data: {
    name: string;
    parentId?: string;
    type?: 'DOCUMENT' | 'NOTE' | 'DRIVE' | 'GENERAL';
    color?: string;
    icon?: string;
    categoryId?: string;
  }): Promise<FolderItem> {
    const response = await api.post('/folders', data);
    return response.data?.data;
  },

  /**
   * Update folder properties (rename, change color, move)
   */
  async updateFolder(id: string, data: {
    name?: string;
    parentId?: string;
    color?: string;
    icon?: string;
    categoryId?: string;
  }): Promise<FolderItem> {
    const response = await api.put(`/folders/${id}`, data);
    return response.data?.data;
  },

  /**
   * Delete folder and all its contents
   */
  async deleteFolder(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  },
};
