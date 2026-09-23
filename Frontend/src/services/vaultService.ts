import { api } from './api';
import type { VaultCredential } from '../types';

export const vaultService = {
  async getCredentials(): Promise<VaultCredential[]> {
    try {
      const response = await api.get('/credentials');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      throw error;
    }
  },

  async createCredential(credData: Partial<VaultCredential>): Promise<VaultCredential> {
    try {
      const response = await api.post('/credentials', credData);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create credential:', error);
      throw error;
    }
  },

  async deleteCredential(id: string): Promise<void> {
    try {
      await api.delete(`/credentials/${id}`);
    } catch (error) {
      console.error(`Failed to delete credential ${id}:`, error);
      throw error;
    }
  }
};
