import { api } from './api';
import type { Website } from '../types';

export const websiteService = {
  async getWebsites(params?: { categoryId?: string; projectId?: string; isFavorite?: boolean; search?: string }): Promise<Website[]> {
    try {
      const response = await api.get('/websites', { params });
      const rawList: any[] = response.data.data || [];
      return rawList.map(item => ({
        ...item,
        isFavorite: item.isFavorite !== undefined ? item.isFavorite : (item.favorite ?? false)
      }));
    } catch (error) {
      console.error('Failed to fetch websites:', error);
      throw error;
    }
  },

  async createWebsite(data: Partial<Website>): Promise<Website> {
    try {
      const response = await api.post('/websites', data);
      const res = response.data.data;
      return {
        ...res,
        isFavorite: res.isFavorite !== undefined ? res.isFavorite : (res.favorite ?? false)
      };
    } catch (error) {
      console.error('Failed to create website:', error);
      throw error;
    }
  },

  async updateWebsite(id: string, data: Partial<Website>): Promise<Website> {
    try {
      const response = await api.put(`/websites/${id}`, data);
      const res = response.data.data;
      return {
        ...res,
        isFavorite: res.isFavorite !== undefined ? res.isFavorite : (res.favorite ?? false)
      };
    } catch (error) {
      console.error('Failed to update website:', error);
      throw error;
    }
  },

  async importBookmarks(bookmarks: Partial<Website>[]): Promise<Website[]> {
    try {
      const response = await api.post('/websites/import', bookmarks);
      const rawList: any[] = response.data.data || [];
      return rawList.map(item => ({
        ...item,
        isFavorite: item.isFavorite !== undefined ? item.isFavorite : (item.favorite ?? false)
      }));
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
      throw error;
    }
  },

  async toggleFavorite(id: string): Promise<Website> {
    try {
      const response = await api.patch(`/websites/${id}/favorite`);
      const res = response.data.data;
      return {
        ...res,
        isFavorite: res.isFavorite !== undefined ? res.isFavorite : (res.favorite ?? false)
      };
    } catch (error) {
      console.error('Failed to toggle website favorite:', error);
      throw error;
    }
  },

  async recordVisit(id: string): Promise<void> {
    try {
      await api.post(`/websites/${id}/visit`);
    } catch (error) {
      console.error('Failed to record website visit:', error);
      throw error;
    }
  },

  async deleteWebsite(id: string): Promise<void> {
    try {
      await api.delete(`/websites/${id}`);
    } catch (error) {
      console.error('Failed to delete website:', error);
      throw error;
    }
  },

  exportBookmarksAsJson(websites: Website[]) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(websites, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bookmarks_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportBookmarksAsHtml(websites: Website[]) {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n`;
    html += `<!-- This is an automatically generated file. It will be read and overwritten. Do Not Edit! -->\n`;
    html += `<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n`;
    html += `<TITLE>Bookmarks</TITLE>\n`;
    html += `<H1>Bookmarks</H1>\n`;
    html += `<DL><p>\n`;
    html += `    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}">My Workspace Bookmarks</H3>\n`;
    html += `    <DL><p>\n`;

    websites.forEach(w => {
      html += `        <DT><A HREF="${w.url}" ADD_DATE="${Math.floor(new Date(w.createdAt || Date.now()).getTime() / 1000)}" ICON="${w.faviconUrl || ''}" TAGS="${w.tags || ''}">${w.name}</A>\n`;
      if (w.description) {
        html += `        <DD>${w.description}\n`;
      }
    });

    html += `    </DL><p>\n`;
    html += `</DL><p>\n`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmarks_export_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  parseBookmarkHtml(htmlContent: string): Partial<Website>[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const links = doc.querySelectorAll('a');
    const results: Partial<Website>[] = [];

    links.forEach((a) => {
      const url = a.getAttribute('href');
      const name = a.textContent?.trim() || a.innerText?.trim();
      const icon = a.getAttribute('icon') || undefined;
      const tags = a.getAttribute('tags') || undefined;
      
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        results.push({
          name: name || url,
          url,
          faviconUrl: icon,
          tags: tags,
          color: '#0c93e7',
          isFavorite: false,
        });
      }
    });

    return results;
  }
};
