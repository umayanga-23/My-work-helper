import { api } from './api';
import type { DocumentItem } from '../types';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const documentService = {
  /**
   * Fetch all documents from the backend / Supabase
   */
  async getDocuments(params?: { categoryId?: string; projectId?: string; search?: string; isFavorite?: boolean }): Promise<DocumentItem[]> {
    const response = await api.get('/documents', { params });
    const docs: DocumentItem[] = response.data?.data || [];
    return docs.map((d) => ({
      ...d,
      isFavorite: Boolean(d.isFavorite || (d as any).favorite),
      favorite: Boolean(d.isFavorite || (d as any).favorite)
    }));
  },

  /**
   * Upload binary file directly to backend which securely streams it to Supabase Storage
   */
  async uploadDocument(
    file: File,
    meta: {
      name?: string;
      categoryId?: string;
      projectId?: string;
      description?: string;
      tags?: string;
    }
  ): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (meta.name) formData.append('name', meta.name);
    if (meta.categoryId) formData.append('categoryId', meta.categoryId);
    if (meta.projectId) formData.append('projectId', meta.projectId);
    if (meta.description) formData.append('description', meta.description);
    if (meta.tags) formData.append('tags', meta.tags);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const doc: DocumentItem = response.data?.data;
    return {
      ...doc,
      isFavorite: Boolean(doc.isFavorite || (doc as any).favorite),
      favorite: Boolean(doc.isFavorite || (doc as any).favorite),
    };
  },

  /**
   * Create document metadata record directly
   */
  async uploadDocumentMetadata(data: Partial<DocumentItem>): Promise<DocumentItem> {
    const response = await api.post('/documents', data);
    const doc: DocumentItem = response.data?.data;
    return {
      ...doc,
      isFavorite: Boolean(doc.isFavorite || (doc as any).favorite),
      favorite: Boolean(doc.isFavorite || (doc as any).favorite),
    };
  },

  /**
   * Toggle favorite state for a document
   */
  async toggleFavorite(id: string): Promise<DocumentItem> {
    const response = await api.patch(`/documents/${id}/favorite`);
    const doc: DocumentItem = response.data?.data;
    return {
      ...doc,
      isFavorite: Boolean(doc.isFavorite || (doc as any).favorite),
      favorite: Boolean(doc.isFavorite || (doc as any).favorite),
    };
  },

  /**
   * Get authenticated / public download & preview URL from Supabase
   */
  async getDownloadUrl(id: string): Promise<string> {
    const response = await api.get(`/documents/${id}/download-url`);
    return response.data?.data;
  },

  /**
   * Delete document record and storage object from Supabase
   */
  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
