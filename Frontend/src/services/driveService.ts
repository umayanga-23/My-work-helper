import { api } from './api';
import type { DriveLink, ResourcePlatform } from '../types';

export const detectPlatform = (url: string): ResourcePlatform => {
  if (!url) return 'WEB_RESOURCE';
  const lower = url.toLowerCase();

  if (lower.includes('drive.google.com/drive') || lower.includes('drive.google.com/folderview') || lower.includes('drive.google.com')) {
    if (lower.includes('docs.google.com/document') || lower.includes('/document/d/')) return 'GOOGLE_DOCS';
    if (lower.includes('docs.google.com/spreadsheets') || lower.includes('sheets.google.com') || lower.includes('/spreadsheets/d/')) return 'GOOGLE_SHEETS';
    if (lower.includes('docs.google.com/presentation') || lower.includes('slides.google.com') || lower.includes('/presentation/d/')) return 'GOOGLE_SLIDES';
    return 'GOOGLE_DRIVE';
  }
  if (lower.includes('docs.google.com/document') || lower.includes('/document/d/')) {
    return 'GOOGLE_DOCS';
  }
  if (lower.includes('docs.google.com/spreadsheets') || lower.includes('sheets.google.com') || lower.includes('/spreadsheets/d/')) {
    return 'GOOGLE_SHEETS';
  }
  if (lower.includes('docs.google.com/presentation') || lower.includes('slides.google.com') || lower.includes('/presentation/d/')) {
    return 'GOOGLE_SLIDES';
  }
  if (lower.includes('chatgpt.com') || lower.includes('chat.openai.com')) {
    return 'CHATGPT';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'YOUTUBE';
  }
  if (lower.includes('linkedin.com')) {
    return 'LINKEDIN';
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return 'FACEBOOK';
  }
  if (lower.includes('github.com') || lower.includes('gitlab.com')) {
    return 'GITHUB';
  }

  return 'WEB_RESOURCE';
};

export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const driveService = {
  async getDriveLinks(params?: { categoryId?: string; projectId?: string; isFavorite?: boolean; search?: string }): Promise<DriveLink[]> {
    const response = await api.get('/drive-links', { params });
    const list: DriveLink[] = response.data?.data || [];
    return list.map((item) => ({
      ...item,
      resourceType: item.resourceType || detectPlatform(item.url),
      isFavorite: Boolean(item.isFavorite || item.favorite),
      favorite: Boolean(item.isFavorite || item.favorite)
    }));
  },

  async createDriveLink(data: Partial<DriveLink>): Promise<DriveLink> {
    const payload = {
      ...data,
      resourceType: data.resourceType || (data.url ? detectPlatform(data.url) : 'WEB_RESOURCE'),
    };
    const response = await api.post('/drive-links', payload);
    const item: DriveLink = response.data?.data;
    return {
      ...item,
      resourceType: item.resourceType || detectPlatform(item.url),
      isFavorite: Boolean(item.isFavorite || item.favorite),
      favorite: Boolean(item.isFavorite || item.favorite)
    };
  },

  async updateDriveLink(id: string, data: Partial<DriveLink>): Promise<DriveLink> {
    const payload = {
      ...data,
      resourceType: data.resourceType || (data.url ? detectPlatform(data.url) : 'WEB_RESOURCE'),
    };
    const response = await api.put(`/drive-links/${id}`, payload);
    const item: DriveLink = response.data?.data;
    return {
      ...item,
      resourceType: item.resourceType || detectPlatform(item.url),
      isFavorite: Boolean(item.isFavorite || item.favorite),
      favorite: Boolean(item.isFavorite || item.favorite)
    };
  },

  async toggleFavorite(id: string): Promise<DriveLink> {
    const response = await api.patch(`/drive-links/${id}/favorite`);
    const item: DriveLink = response.data?.data;
    return {
      ...item,
      resourceType: item.resourceType || detectPlatform(item.url),
      isFavorite: Boolean(item.isFavorite || item.favorite),
      favorite: Boolean(item.isFavorite || item.favorite)
    };
  },

  async deleteDriveLink(id: string): Promise<void> {
    await api.delete(`/drive-links/${id}`);
  }
};
