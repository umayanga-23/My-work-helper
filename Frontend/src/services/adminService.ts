import { api } from './api';

export interface SupabaseStorageMetrics {
  bucketName: string;
  status: string;
  usedBytes: number;
  totalQuotaBytes: number;
  usedFormatted: string;
  freeFormatted: string;
  totalQuotaFormatted: string;
  usedPercentage: number;
  totalFiles: number;
  pdfCount: number;
  pdfBytes: number;
  imageCount: number;
  imageBytes: number;
  officeCount: number;
  officeBytes: number;
  otherCount: number;
  otherBytes: number;
  largestFileName: string;
  largestFileSizeFormatted: string;
}

export interface SystemMetrics {
  status: string;
  uptimeSeconds: number;
  javaVersion: string;
  osName: string;
  totalMemoryMb: number;
  freeMemoryMb: number;
  maxMemoryMb: number;
  supabaseStorageStatus: string;
  supabaseStorageMetrics?: SupabaseStorageMetrics;
  databaseTableCounts: Record<string, number>;
}

export const adminService = {
  async getMetrics(): Promise<SystemMetrics> {
    const response = await api.get('/admin/metrics');
    return response.data.data;
  },

  async getSupabaseSpace(): Promise<SupabaseStorageMetrics> {
    const response = await api.get('/admin/supabase-space');
    return response.data.data;
  },
};
