import { api } from './api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ROLE_ADMIN' | 'ROLE_USER';
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface DemoVisitor {
  id: string;
  name: string;
  ipAddress: string;
  country: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  visitedAt: string;
}

export interface ClientInquiry {
  id: string;
  visitorName: string;
  emailOrPhone: string;
  requirement: string;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  async login(usernameOrEmail: string, password: string):Promise<AuthResponse> {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
      usernameOrEmail,
      password,
    });
    return res.data.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await api.get<{ success: boolean; data: UserProfile }>('/auth/me');
    return res.data.data;
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', {
      email,
    });
    return res.data.message;
  },

  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<string> {
    const res = await api.post<{ success: boolean; message: string }>('/auth/reset-password', {
      email,
      otpCode,
      newPassword,
    });
    return res.data.message;
  },

  async logDemoVisitor(payload: { name: string; deviceType?: string; browser?: string; os?: string }): Promise<DemoVisitor> {
    const res = await api.post<{ success: boolean; data: DemoVisitor }>('/analytics/demo-visitor', payload);
    return res.data.data;
  },

  async submitInquiry(payload: { visitorName: string; emailOrPhone: string; requirement: string }): Promise<ClientInquiry> {
    const res = await api.post<{ success: boolean; data: ClientInquiry }>('/inquiries', payload);
    return res.data.data;
  },

  async getDemoVisitors(): Promise<DemoVisitor[]> {
    const res = await api.get<{ success: boolean; data: DemoVisitor[] }>('/admin/demo-visitors');
    return res.data.data;
  },

  async getInquiries(): Promise<ClientInquiry[]> {
    const res = await api.get<{ success: boolean; data: ClientInquiry[] }>('/admin/inquiries');
    return res.data.data;
  },

  async updateInquiryStatus(id: string, status: string, notes?: string): Promise<ClientInquiry> {
    const res = await api.patch<{ success: boolean; data: ClientInquiry }>(`/admin/inquiries/${id}/status`, {
      status,
      notes,
    });
    return res.data.data;
  },
};
