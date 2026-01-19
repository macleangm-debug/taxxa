import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    set({
      token: access_token,
      user,
      isAuthenticated: true,
    });
  },

  login: async (phone_number: string, password: string) => {
    const response = await authAPI.login(phone_number, password);
    const { access_token, user } = response.data;
    
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    set({
      token: access_token,
      user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Refresh profile in background
        get().refreshProfile();
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      set({ isLoading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const response = await userAPI.getProfile();
      const user = response.data;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },
}));
