import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://prizescan-2.preview.emergentagent.com';

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

interface Country {
  id: string;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  timezone: string;
  tax_rate: number;
  phone_code: string;
  language: string;
  date_format: string;
  is_active: boolean;
}

interface PlatformSettings {
  active_country: string | null;
  default_draw_types: string[];
  default_prize_tiers: any[];
  scan_cooldown_seconds: number;
  max_scans_per_day: number;
  entries_per_amount: number;
  min_entries_per_scan: number;
  receipt_expiry_days: number;
}

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
  countries: Country[];
  activeCountry: Country | null;
  settings: PlatformSettings | null;
  
  // Auth Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  
  // Dashboard
  fetchDashboard: () => Promise<void>;
  
  // Users
  fetchUsers: (page?: number, limit?: number, status?: string, search?: string) => Promise<any>;
  fetchUserDetails: (userId: string) => Promise<any>;
  updateUserStatus: (userId: string, status: string, reason?: string) => Promise<void>;
  
  // Draws
  fetchDraws: (status?: string) => Promise<void>;
  createDraw: (drawType: string, days: number, prizeTiers?: any[], drawDate?: string) => Promise<void>;
  updateDraw: (drawId: string, drawType?: string, drawDate?: string, prizeTiers?: any[]) => Promise<void>;
  deleteDraw: (drawId: string) => Promise<void>;
  completeDraw: (drawId: string) => Promise<any>;
  cancelDraw: (drawId: string) => Promise<void>;
  
  // Scans
  fetchScans: (page?: number, limit?: number, status?: string) => Promise<any>;
  
  // Fraud
  fetchSuspiciousUsers: () => Promise<void>;
  
  // Analytics
  fetchAnalytics: (type: string, days?: number) => Promise<any>;
  
  // Logs
  fetchLogs: (page?: number, limit?: number) => Promise<any>;
  
  // Countries
  fetchCountries: () => Promise<void>;
  createCountry: (country: Omit<Country, 'id'>) => Promise<void>;
  updateCountry: (countryId: string, updates: Partial<Country>) => Promise<void>;
  deleteCountry: (countryId: string) => Promise<void>;
  setActiveCountry: (countryId: string | null) => Promise<void>;
  
  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<PlatformSettings>) => Promise<void>;
  
  // Audit
  fetchDrawAudit: (drawId: string) => Promise<any>;
  exportDrawAudit: (drawId: string) => Promise<any>;
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
  countries: [],
  activeCountry: null,
  settings: null,

  login: async (username: string, password: string) => {
    const response = await adminApi.post('/admin/login', { username, password });
    const { access_token } = response.data;
    
    await AsyncStorage.setItem('admin_token', access_token);
    set({ token: access_token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('admin_token');
    await AsyncStorage.removeItem('active_country_id');
    set({ token: null, isAuthenticated: false, dashboard: null, activeCountry: null });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('admin_token');
      if (token) {
        try {
          await adminApi.get('/admin/dashboard');
          set({ token, isAuthenticated: true });
          
          // Load countries and active country
          await get().fetchCountries();
          await get().fetchSettings();
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

  createDraw: async (drawType: string, days: number, prizeTiers?: any[], drawDate?: string) => {
    // Send all data in request body as JSON
    const payload = {
      draw_type: drawType,
      days_duration: days,
      draw_date: drawDate,
      prize_tiers: prizeTiers
    };
    
    await adminApi.post('/admin/draws', payload);
    await get().fetchDraws();
  },

  updateDraw: async (drawId: string, drawType?: string, drawDate?: string, prizeTiers?: any[]) => {
    const payload: any = {};
    if (drawType) payload.draw_type = drawType;
    if (drawDate) payload.draw_date = drawDate;
    if (prizeTiers) payload.prize_tiers = prizeTiers;
    
    await adminApi.put(`/admin/draws/${drawId}`, payload);
    await get().fetchDraws();
  },

  deleteDraw: async (drawId: string) => {
    await adminApi.delete(`/admin/draws/${drawId}`);
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

  // Country Management
  fetchCountries: async () => {
    try {
      const response = await adminApi.get('/admin/countries');
      const countries = response.data;
      set({ countries });
      
      // Get active country from settings
      const { settings } = get();
      if (settings?.active_country) {
        const active = countries.find((c: Country) => c.id === settings.active_country);
        if (active) {
          set({ activeCountry: active });
        }
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  },

  createCountry: async (country: Omit<Country, 'id'>) => {
    await adminApi.post('/admin/countries', country);
    await get().fetchCountries();
  },

  updateCountry: async (countryId: string, updates: Partial<Country>) => {
    await adminApi.put(`/admin/countries/${countryId}`, updates);
    await get().fetchCountries();
  },

  deleteCountry: async (countryId: string) => {
    await adminApi.delete(`/admin/countries/${countryId}`);
    await get().fetchCountries();
  },

  setActiveCountry: async (countryId: string | null) => {
    await adminApi.put(`/admin/settings/active-country?country_id=${countryId || ''}`);
    
    if (countryId) {
      const { countries } = get();
      const active = countries.find(c => c.id === countryId);
      set({ activeCountry: active || null });
      await AsyncStorage.setItem('active_country_id', countryId);
    } else {
      set({ activeCountry: null });
      await AsyncStorage.removeItem('active_country_id');
    }
  },

  // Settings
  fetchSettings: async () => {
    try {
      const response = await adminApi.get('/admin/settings');
      set({ settings: response.data });
      
      // Set active country if exists
      if (response.data.active_country) {
        const { countries } = get();
        const active = countries.find(c => c.id === response.data.active_country);
        if (active) {
          set({ activeCountry: active });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  },

  updateSettings: async (settings: Partial<PlatformSettings>) => {
    await adminApi.put('/admin/settings', settings);
    await get().fetchSettings();
  },
}));
