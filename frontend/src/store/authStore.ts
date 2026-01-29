import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { authAPI, userAPI } from '../utils/api';

interface User {
  id: string;
  phone_number: string;
  name?: string;
  created_at: string;
  total_scans: number;
  valid_scans: number;
  total_entries: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth actions
  register: (phone_number: string) => Promise<{ otp?: string; message: string }>;
  verifyOTP: (phone_number: string, otp: string) => Promise<{ success: boolean }>;
  createPassword: (phone_number: string, password: string, name?: string) => Promise<void>;
  login: (phone_number: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  register: async (phone_number: string) => {
    const response = await authAPI.register(phone_number);
    return {
      otp: response.data.otp_for_testing,
      message: response.data.message,
    };
  },

  verifyOTP: async (phone_number: string, otp: string) => {
    await authAPI.verifyOTP(phone_number, otp);
    return { success: true };
  },

  createPassword: async (phone_number: string, password: string, name?: string) => {
    const response = await authAPI.createPassword(phone_number, password, name);
    const { access_token, user } = response.data;
    
    // Use cross-platform storage
    await storage.setItem(STORAGE_KEYS.TOKEN, access_token);
    await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    console.log('[Auth] Password created, token saved');
    
    set({
      token: access_token,
      user,
      isAuthenticated: true,
    });
  },

  login: async (phone_number: string, password: string) => {
    const response = await authAPI.login(phone_number, password);
    const { access_token, user } = response.data;
    
    // Use cross-platform storage
    await storage.setItem(STORAGE_KEYS.TOKEN, access_token);
    await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    console.log('[Auth] Login successful, token saved:', access_token.substring(0, 20) + '...');
    
    set({
      token: access_token,
      user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await storage.removeItem(STORAGE_KEYS.TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER);
    
    console.log('[Auth] Logged out, tokens cleared');
    
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      console.log('[Auth] Loading stored auth...');
      
      const token = await storage.getItem(STORAGE_KEYS.TOKEN);
      const userStr = await storage.getItem(STORAGE_KEYS.USER);
      
      console.log('[Auth] Token found:', token ? 'Yes (' + token.substring(0, 20) + '...)' : 'No');
      console.log('[Auth] User found:', userStr ? 'Yes' : 'No');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        console.log('[Auth] Auth restored successfully for user:', user.phone_number);
        
        // Refresh profile in background
        get().refreshProfile();
      } else {
        console.log('[Auth] No stored auth found');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[Auth] Error loading auth:', error);
      set({ isLoading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const response = await userAPI.getProfile();
      const user = response.data;
      await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      set({ user });
      console.log('[Auth] Profile refreshed');
    } catch (error) {
      console.error('[Auth] Error refreshing profile:', error);
    }
  },
}));
