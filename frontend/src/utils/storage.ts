/**
 * Cross-platform storage utility
 * 
 * This module provides a unified storage interface that works reliably
 * on both mobile (iOS/Android) and web platforms.
 * 
 * On web: Uses localStorage directly for better reliability
 * On mobile: Uses AsyncStorage
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'taxxa_auth_token',
  USER: 'taxxa_user_data',
  SETTINGS: 'taxxa_settings',
} as const;

/**
 * Cross-platform storage that works reliably on both web and mobile
 */
export const storage = {
  /**
   * Get an item from storage
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(key);
        return value;
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`[Storage] Error getting item ${key}:`, error);
      return null;
    }
  },

  /**
   * Set an item in storage
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`[Storage] Error setting item ${key}:`, error);
      throw error;
    }
  },

  /**
   * Remove an item from storage
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`[Storage] Error removing item ${key}:`, error);
      throw error;
    }
  },

  /**
   * Clear all app storage
   */
  clear: async (): Promise<void> => {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        // Only clear our app's keys, not all localStorage
        Object.values(STORAGE_KEYS).forEach(key => {
          window.localStorage.removeItem(key);
        });
      } else {
        await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      }
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
      throw error;
    }
  },

  /**
   * Get multiple items at once
   */
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        return keys.map(key => [key, window.localStorage.getItem(key)]);
      } else {
        const result = await AsyncStorage.multiGet(keys);
        return result;
      }
    } catch (error) {
      console.error('[Storage] Error getting multiple items:', error);
      return keys.map(key => [key, null]);
    }
  },

  /**
   * Set multiple items at once
   */
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    try {
      if (isWeb && typeof window !== 'undefined' && window.localStorage) {
        keyValuePairs.forEach(([key, value]) => {
          window.localStorage.setItem(key, value);
        });
      } else {
        await AsyncStorage.multiSet(keyValuePairs);
      }
    } catch (error) {
      console.error('[Storage] Error setting multiple items:', error);
      throw error;
    }
  },
};

/**
 * Synchronous storage access for web only
 * Useful for getting token immediately without await
 */
export const syncStorage = {
  getItem: (key: string): string | null => {
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  
  setItem: (key: string, value: string): void => {
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
};

export default storage;
