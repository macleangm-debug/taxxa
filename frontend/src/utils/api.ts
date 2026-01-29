import axios from 'axios';
import { Platform } from 'react-native';
import { storage, STORAGE_KEYS, syncStorage } from './storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://winnerscan.preview.emergentagent.com';
const isWeb = Platform.OS === 'web';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    // On web, try sync access first for better reliability
    let token: string | null = null;
    
    if (isWeb) {
      // Try synchronous access first (more reliable on web)
      token = syncStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    
    // Fall back to async storage
    if (!token) {
      token = await storage.getItem(STORAGE_KEYS.TOKEN);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token attached to request:', token.substring(0, 20) + '...');
    } else {
      console.log('[API] No token found for request to:', config.url);
    }
  } catch (error) {
    console.error('[API] Error getting token:', error);
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
  
  forgotPassword: (phone_number: string) =>
    api.post('/auth/forgot-password', { phone_number }),
  
  resetPassword: (phone_number: string, password: string) =>
    api.post('/auth/reset-password', { phone_number, password }),
};

// Legacy Scan API (kept for backward compatibility)
export const scanAPI = {
  scan: (qr_data: string, geo_location?: { latitude: number; longitude: number }) =>
    api.post('/scan', { qr_data, geo_location }),
  
  getHistory: (limit: number = 50) =>
    api.get(`/scan/history?limit=${limit}`),
};

// ============== NEW RECEIPT API v1 ==============
// Industry-standard multi-step receipt processing

export interface DecodeResponse {
  success: boolean;
  decode_id: string;
  detected_format: string;
  receipt: {
    receipt_number: string;
    receipt_type: string;
    merchant: {
      tin: string;
      name?: string;
      address?: string;
      city?: string;
      country?: string;
    };
    transaction_date: string;
    total_amount: number;
    currency: string;
    subtotal?: number;
    total_tax?: number;
    tax_breakdown?: Array<{
      tax_type: string;
      tax_rate: number;
      tax_amount: number;
    }>;
    payment_method?: string;
    verification?: {
      verification_code?: string;
      fiscal_device_id?: string;
      authority_code?: string;
    };
  } | null;
  confidence_score: number;
  warnings: string[];
  errors: string[];
  parsed_fields: Record<string, any>;
}

export interface ValidationCheck {
  name: string;
  description: string;
  passed: boolean;
  critical: boolean;
  details?: Record<string, any>;
  mode?: string;
  response?: Record<string, any>;
}

export interface ValidateResponse {
  success: boolean;
  validation_id: string;
  status: 'valid' | 'invalid' | 'duplicate' | 'expired' | 'pending_validation' | 'validation_failed';
  is_valid: boolean;
  validation_mode: string;
  checks_performed: ValidationCheck[];
  authority_response?: Record<string, any>;
  errors: string[];
  validated_at: string;
}

export interface SubmitResponse {
  success: boolean;
  receipt_id: string;
  status: string;
  entries_earned: number;
  bonus_entries: number;
  total_entries: number;
  message: string;
  submitted_at: string;
  next_draw?: string;
}

export const receiptAPI = {
  // Step 1: Decode QR code
  decode: (qr_data: string, format_hint?: string, jurisdiction?: string) =>
    api.post<DecodeResponse>('/v1/receipts/decode', { 
      qr_data, 
      format_hint, 
      jurisdiction 
    }),
  
  // Step 2: Validate decoded receipt
  validate: (decode_id: string, validation_mode: 'mock' | 'real' = 'mock') =>
    api.post<ValidateResponse>('/v1/receipts/validate', { 
      decode_id, 
      validation_mode 
    }),
  
  // Step 3: Submit validated receipt for draw entries
  submit: (validation_id: string, geo_location?: { latitude: number; longitude: number }) =>
    api.post<SubmitResponse>('/v1/receipts/submit', { 
      validation_id, 
      geo_location 
    }),
  
  // Get receipt details
  getReceipt: (receipt_id: string) =>
    api.get(`/v1/receipts/${receipt_id}`),
  
  // List user's receipts
  listReceipts: (skip: number = 0, limit: number = 20, status?: string) => {
    let url = `/v1/receipts?skip=${skip}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },

  // Full scan flow: decode → validate → submit (convenience method)
  fullScan: async (qr_data: string, geo_location?: { latitude: number; longitude: number }) => {
    // Step 1: Decode
    const decodeRes = await api.post<DecodeResponse>('/v1/receipts/decode', { qr_data });
    if (!decodeRes.data.success) {
      throw new Error(decodeRes.data.errors[0] || 'Failed to decode QR code');
    }

    // Step 2: Validate
    const validateRes = await api.post<ValidateResponse>('/v1/receipts/validate', {
      decode_id: decodeRes.data.decode_id,
      validation_mode: 'mock'
    });

    // Step 3: Submit (only if valid)
    if (validateRes.data.is_valid) {
      const submitRes = await api.post<SubmitResponse>('/v1/receipts/submit', {
        validation_id: validateRes.data.validation_id,
        geo_location
      });
      return {
        decode: decodeRes.data,
        validate: validateRes.data,
        submit: submitRes.data,
        success: true
      };
    }

    return {
      decode: decodeRes.data,
      validate: validateRes.data,
      submit: null,
      success: false
    };
  }
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
  
  // Generate a test QR in the new Receipt API format
  generateReceiptQR: (merchantName: string = 'Test Store', amount: number = 100) => {
    const now = new Date();
    const receipt = {
      receipt_number: `INV-${now.getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      merchant_tin: `${Math.floor(Math.random() * 90000000000) + 10000000000}`,
      merchant_name: merchantName,
      total_amount: amount,
      tax_amount: Math.round(amount * 0.15 * 100) / 100,
      transaction_date: now.toISOString(),
      currency: 'USD'
    };
    return Promise.resolve({ data: { qr_data: JSON.stringify(receipt) } });
  }
};

export default api;
