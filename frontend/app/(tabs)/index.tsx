import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useAppConfigStore } from '../../src/store/appConfigStore';
import { userAPI, drawAPI } from '../../src/utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface CurrencyInfo {
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  country_name: string;
}

interface Stats {
  total_scans: number;
  valid_scans: number;
  total_entries: number;
  current_draw_entries: number;
  upcoming_draws: Array<{
    id: string;
    draw_type: string;
    end_date: string;
    user_entries: number;
    prize_pool: number;
  }>;
  past_winnings: Array<{
    draw_type: string;
    date: string;
    amount: number;
  }>;
  currency?: CurrencyInfo;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currency, setCurrency, fetchConfig } = useAppConfigStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const response = await userAPI.getStats();
      setStats(response.data);
      
      // Update currency from stats response
      if (response.data.currency) {
        setCurrency(response.data.currency);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Ionicons name="ticket" size={32} color="#fff" />
            <Text style={styles.statValue}>{stats?.current_draw_entries || 0}</Text>
            <Text style={styles.statLabel}>Active Entries</Text>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statCardSmall}>
              <Ionicons name="scan" size={24} color="#10B981" />
              <Text style={styles.statValueSmall}>{stats?.valid_scans || 0}</Text>
              <Text style={styles.statLabelSmall}>Valid Scans</Text>
            </View>
            <View style={styles.statCardSmall}>
              <Ionicons name="receipt" size={24} color="#F59E0B" />
              <Text style={styles.statValueSmall}>{stats?.total_scans || 0}</Text>
              <Text style={styles.statLabelSmall}>Total Scans</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/scan')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="scan" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Scan Receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/draws')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="trophy" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>View Draws</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/history')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="time" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Draws */}
        <Text style={styles.sectionTitle}>Upcoming Draws</Text>
        {stats?.upcoming_draws && stats.upcoming_draws.length > 0 ? (
          stats.upcoming_draws.map((draw) => (
            <View key={draw.id} style={styles.drawCard}>
              <View style={styles.drawInfo}>
                <Ionicons name="calendar" size={24} color="#3B82F6" />
                <View style={styles.drawDetails}>
                  <Text style={styles.drawType}>
                    {draw.draw_type.charAt(0).toUpperCase() + draw.draw_type.slice(1)} Draw
                  </Text>
                  <Text style={styles.drawDate}>
                    Ends {formatDistanceToNow(new Date(draw.end_date), { addSuffix: true })}
                  </Text>
                </View>
              </View>
              <View style={styles.drawEntries}>
                <Text style={styles.entriesValue}>{draw.user_entries}</Text>
                <Text style={styles.entriesLabel}>entries</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#64748B" />
            <Text style={styles.emptyText}>No active draws</Text>
          </View>
        )}

        {/* Past Winnings */}
        {stats?.past_winnings && stats.past_winnings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past Winnings</Text>
            {stats.past_winnings.map((win, index) => (
              <View key={index} style={styles.winCard}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <View style={styles.winDetails}>
                  <Text style={styles.winType}>
                    {win.draw_type.charAt(0).toUpperCase() + win.draw_type.slice(1)} Draw
                  </Text>
                  <Text style={styles.winDate}>
                    {format(new Date(win.date), 'MMM d, yyyy')}
                  </Text>
                </View>
                <Text style={styles.winAmount}>${win.amount}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    ...(isWeb && {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 480,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#94A3B8',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    marginBottom: 24,
  },
  primaryCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValueSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabelSmall: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  drawCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawDetails: {
    marginLeft: 12,
  },
  drawType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  drawDate: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  drawEntries: {
    alignItems: 'center',
  },
  entriesValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  entriesLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  winCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  winDetails: {
    flex: 1,
    marginLeft: 12,
  },
  winType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  winDate: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  winAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
});
