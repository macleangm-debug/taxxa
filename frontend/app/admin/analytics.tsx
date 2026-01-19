import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const { fetchAnalytics } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [scansByDay, setScansByDay] = useState<any[]>([]);
  const [usersByDay, setUsersByDay] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [scans, users, merchantData, topUsersData] = await Promise.all([
        fetchAnalytics('scans-by-day', 14),
        fetchAnalytics('users-by-day', 14),
        fetchAnalytics('merchants'),
        fetchAnalytics('top-users'),
      ]);
      setScansByDay(scans);
      setUsersByDay(users);
      setMerchants(merchantData);
      setTopUsers(topUsersData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAnalytics]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxScans = Math.max(...scansByDay.map(d => d.total), 1);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Scans Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Scans (Last 14 Days)</Text>
          <View style={styles.chart}>
            {scansByDay.slice(-7).map((day, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      styles.barValid,
                      { height: `${(day.valid / maxScans) * 100}%` }
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.barInvalid,
                      { height: `${((day.invalid + day.duplicate) / maxScans) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.date.split('-')[2]}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Valid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Invalid/Duplicate</Text>
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.chartTitle}>14-Day Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {scansByDay.reduce((sum, d) => sum + d.total, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Scans</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                {scansByDay.reduce((sum, d) => sum + d.valid, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Valid</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                {usersByDay.reduce((sum, d) => sum + d.count, 0)}
              </Text>
              <Text style={styles.summaryLabel}>New Users</Text>
            </View>
          </View>
        </View>

        {/* Top Merchants */}
        <View style={styles.listCard}>
          <Text style={styles.chartTitle}>Top Merchants</Text>
          {merchants.slice(0, 5).map((merchant, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{merchant.merchant_name}</Text>
                <Text style={styles.listItemSubtitle}>{merchant.total_scans} scans</Text>
              </View>
              <View style={styles.listItemStats}>
                <Text style={styles.listItemValue}>${merchant.total_amount.toLocaleString()}</Text>
                <Text style={styles.listItemLabel}>{merchant.total_entries} entries</Text>
              </View>
            </View>
          ))}
          {merchants.length === 0 && (
            <Text style={styles.emptyText}>No merchant data yet</Text>
          )}
        </View>

        {/* Top Users */}
        <View style={styles.listCard}>
          <Text style={styles.chartTitle}>Top Users (By Entries)</Text>
          {topUsers.slice(0, 5).map((user, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.rankBadge, index < 3 && styles.topRank]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{user.name || 'Anonymous'}</Text>
                <Text style={styles.listItemSubtitle}>{user.phone_number}</Text>
              </View>
              <View style={styles.listItemStats}>
                <Text style={[styles.listItemValue, { color: '#3B82F6' }]}>
                  {user.total_entries}
                </Text>
                <Text style={styles.listItemLabel}>entries</Text>
              </View>
            </View>
          ))}
          {topUsers.length === 0 && (
            <Text style={styles.emptyText}>No user data yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  chartCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 16 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 150, alignItems: 'flex-end' },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 120, width: 24, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barValid: { backgroundColor: '#10B981' },
  barInvalid: { backgroundColor: '#EF4444', marginTop: 2 },
  barLabel: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#94A3B8' },
  summaryCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  listCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  topRank: { backgroundColor: '#F59E0B' },
  rankText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  listItemInfo: { flex: 1, marginLeft: 12 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  listItemSubtitle: { fontSize: 12, color: '#94A3B8' },
  listItemStats: { alignItems: 'flex-end' },
  listItemValue: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  listItemLabel: { fontSize: 10, color: '#94A3B8' },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
