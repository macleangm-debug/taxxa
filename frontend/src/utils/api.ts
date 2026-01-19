import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://taxdraw-app.preview.emergentagent.com';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (phone_number: string) =>
    api.post('/auth/register', { phone_number }),
  
  verifyOTP: (phone_number: string, otp: string) =>
    api.post('/auth/verify-otp', { phone_number, otp }),
  
  createPassword: (phone_number: string, password: string, name?: string) =>
    api.post('/auth/create-password', { phone_number, password, name }),
  
  login: (phone_number: string, password: string) =>
    api.post('/auth/login', { phone_number, password }),
};

// Scan API
export const scanAPI = {
  scan: (qr_data: string, geo_location?: { latitude: number; longitude: number }) =>
    api.post('/scan', { qr_data, geo_location }),
  
  getHistory: (limit: number = 50) =>
    api.get(`/scan/history?limit=${limit}`),
};

// Draw API
export const drawAPI = {
  getDraws: () => api.get('/draws'),
  getActiveDraws: () => api.get('/draws/active'),
};

// User API
export const userAPI = {
  getStats: () => api.get('/user/stats'),
  getProfile: () => api.get('/user/profile'),
};

// Education API
export const educationAPI = {
  getContent: () => api.get('/education'),
};

// Test API (for generating test QR codes)
export const testAPI = {
  generateQR: (merchant_id: string = 'MER-001', amount: number = 100) =>
    api.get(`/test/generate-qr?merchant_id=${merchant_id}&amount=${amount}`),
  getMerchants: () => api.get('/test/merchants'),
};

export default api;
