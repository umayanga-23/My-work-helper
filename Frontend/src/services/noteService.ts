import { api } from './api';
import type { Note } from '../types';

const normalizeNote = (n: any): Note => ({
  ...n,
  isFavorite: Boolean(n.isFavorite ?? n.favorite),
  favorite: Boolean(n.isFavorite ?? n.favorite),
  isArchived: Boolean(n.isArchived ?? n.archived),
  archived: Boolean(n.isArchived ?? n.archived),
});

export const noteService = {
  async getNotes(params?: { categoryId?: string; projectId?: string; isFavorite?: boolean; isArchived?: boolean; search?: string }): Promise<Note[]> {
    try {
      const response = await api.get('/notes', { params });
      return (response.data.data || []).map(normalizeNote);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      throw error;
    }
  },

  async createNote(data: Partial<Note>): Promise<Note> {
    try {
      const response = await api.post('/notes', data);
      return normalizeNote(response.data.data);
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  },

  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    try {
      const response = await api.put(`/notes/${id}`, data);
      return normalizeNote(response.data.data);
    } catch (error) {
      console.error(`Failed to update note ${id}:`, error);
      throw error;
    }
  },

  async toggleFavorite(id: string): Promise<Note> {
    try {
      const response = await api.patch(`/notes/${id}/favorite`);
      return normalizeNote(response.data.data);
    } catch (error) {
      console.error(`Failed to toggle favorite for note ${id}:`, error);
      throw error;
    }
  },

  async toggleArchive(id: string): Promise<Note> {
    try {
      const response = await api.patch(`/notes/${id}/archive`);
      return normalizeNote(response.data.data);
    } catch (error) {
      console.error(`Failed to toggle archive for note ${id}:`, error);
      throw error;
    }
  },

  async deleteNote(id: string): Promise<void> {
    try {
      await api.delete(`/notes/${id}`);
    } catch (error) {
      console.error(`Failed to delete note ${id}:`, error);
      throw error;
    }
  }
};
