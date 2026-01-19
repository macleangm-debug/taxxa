import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://taxdraw-app.preview.emergentagent.com';

const adminApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
adminApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AdminState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dashboard: any | null;
  users: any[];
  draws: any[];
  scans: any[];
  analytics: any | null;
  suspiciousUsers: any[];
  logs: any[];
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchUsers: (page?: number, limit?: number, status?: string, search?: string) => Promise<any>;
  fetchUserDetails: (userId: string) => Promise<any>;
  updateUserStatus: (userId: string, status: string, reason?: string) => Promise<void>;
  fetchDraws: (status?: string) => Promise<void>;
  createDraw: (drawType: string, days: number) => Promise<void>;
  completeDraw: (drawId: string) => Promise<any>;
  cancelDraw: (drawId: string) => Promise<void>;
  fetchScans: (page?: number, limit?: number, status?: string) => Promise<any>;
  fetchSuspiciousUsers: () => Promise<void>;
  fetchAnalytics: (type: string, days?: number) => Promise<any>;
  fetchLogs: (page?: number, limit?: number) => Promise<any>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,
  dashboard: null,
  users: [],
  draws: [],
  scans: [],
  analytics: null,
  suspiciousUsers: [],
  logs: [],

  login: async (username: string, password: string) => {
    const response = await adminApi.post('/admin/login', { username, password });
    const { access_token } = response.data;
    
    await AsyncStorage.setItem('admin_token', access_token);
    set({ token: access_token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('admin_token');
    set({ token: null, isAuthenticated: false, dashboard: null });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('admin_token');
      if (token) {
        // Verify token is still valid
        try {
          await adminApi.get('/admin/dashboard');
          set({ token, isAuthenticated: true });
        } catch {
          await AsyncStorage.removeItem('admin_token');
        }
      }
    } catch (error) {
      console.error('Error loading admin auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDashboard: async () => {
    const response = await adminApi.get('/admin/dashboard');
    set({ dashboard: response.data });
  },

  fetchUsers: async (page = 1, limit = 20, status?: string, search?: string) => {
    let url = `/admin/users?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${search}`;
    
    const response = await adminApi.get(url);
    set({ users: response.data.users });
    return response.data;
  },

  fetchUserDetails: async (userId: string) => {
    const response = await adminApi.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, status: string, reason?: string) => {
    await adminApi.put(`/admin/users/${userId}/status?status=${status}${reason ? `&reason=${reason}` : ''}`);
  },

  fetchDraws: async (status?: string) => {
    let url = '/admin/draws';
    if (status) url += `?status=${status}`;
    
    const response = await adminApi.get(url);
    set({ draws: response.data });
  },

  createDraw: async (drawType: string, days: number) => {
    await adminApi.post(`/admin/draws?draw_type=${drawType}&days_duration=${days}`);
    await get().fetchDraws();
  },

  completeDraw: async (drawId: string) => {
    const response = await adminApi.post(`/admin/draws/${drawId}/complete`);
    await get().fetchDraws();
    return response.data;
  },

  cancelDraw: async (drawId: string) => {
    await adminApi.delete(`/admin/draws/${drawId}`);
    await get().fetchDraws();
  },

  fetchScans: async (page = 1, limit = 50, status?: string) => {
    let url = `/admin/scans?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    
    const response = await adminApi.get(url);
    set({ scans: response.data.scans });
    return response.data;
  },

  fetchSuspiciousUsers: async () => {
    const response = await adminApi.get('/admin/fraud/suspicious-users');
    set({ suspiciousUsers: response.data.suspicious_users });
  },

  fetchAnalytics: async (type: string, days = 30) => {
    const response = await adminApi.get(`/admin/analytics/${type}?days=${days}`);
    return response.data;
  },

  fetchLogs: async (page = 1, limit = 50) => {
    const response = await adminApi.get(`/admin/logs?page=${page}&limit=${limit}`);
    set({ logs: response.data.logs });
    return response.data;
  },
}));
