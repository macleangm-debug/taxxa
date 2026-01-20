import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

interface CurrencyInfo {
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  country_name: string;
}

interface AppConfigState {
  currency: CurrencyInfo;
  isLoading: boolean;
  lastFetched: number | null;
  
  // Actions
  fetchConfig: () => Promise<void>;
  setCurrency: (currency: CurrencyInfo) => void;
  formatCurrency: (amount: number) => string;
}

const DEFAULT_CURRENCY: CurrencyInfo = {
  currency_code: 'USD',
  currency_symbol: '$',
  currency_name: 'US Dollar',
  country_name: 'Default',
};

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  currency: DEFAULT_CURRENCY,
  isLoading: false,
  lastFetched: null,

  fetchConfig: async () => {
    // Only fetch if not fetched in last 5 minutes
    const lastFetched = get().lastFetched;
    const now = Date.now();
    if (lastFetched && now - lastFetched < 5 * 60 * 1000) {
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/app/config');
      const currency = response.data.currency || DEFAULT_CURRENCY;
      
      set({
        currency,
        lastFetched: now,
      });
      
      // Store in AsyncStorage for offline access
      await AsyncStorage.setItem('app_currency', JSON.stringify(currency));
    } catch (error) {
      console.error('Error fetching app config:', error);
      
      // Try to load from AsyncStorage
      try {
        const stored = await AsyncStorage.getItem('app_currency');
        if (stored) {
          set({ currency: JSON.parse(stored) });
        }
      } catch (e) {
        // Use default
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrency: (currency: CurrencyInfo) => {
    set({ currency });
  },

  formatCurrency: (amount: number) => {
    const { currency } = get();
    return `${currency.currency_symbol} ${amount.toLocaleString()}`;
  },
}));
