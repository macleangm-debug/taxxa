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
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Performance overview</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Scans Chart */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="bar-chart" size={18} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>Scans (Last 7 Days)</Text>
          </View>
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
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="stats-chart" size={18} color="#2563EB" />
            </View>
            <Text style={styles.cardTitle}>14-Day Summary</Text>
          </View>
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
              <Text style={[styles.summaryValue, { color: '#2563EB' }]}>
                {usersByDay.reduce((sum, d) => sum + d.count, 0)}
              </Text>
              <Text style={styles.summaryLabel}>New Users</Text>
            </View>
          </View>
        </View>

        {/* Top Merchants */}
        <View style={styles.listCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="storefront" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>Top Merchants</Text>
          </View>
          {merchants.slice(0, 5).map((merchant, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.rankBadge, index < 3 && styles.topRank]}>
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
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="trophy" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.cardTitle}>Top Users (By Entries)</Text>
          </View>
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
                <Text style={[styles.listItemValue, { color: '#8B5CF6' }]}>
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16 
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 140, alignItems: 'flex-end' },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 110, width: 24, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barValid: { backgroundColor: '#10B981' },
  barInvalid: { backgroundColor: '#EF4444', marginTop: 2 },
  barLabel: { fontSize: 10, color: '#6B7280', marginTop: 6 },
  
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#6B7280' },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 26, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rankBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  topRank: { backgroundColor: '#FEF3C7' },
  rankText: { color: '#111827', fontWeight: '600', fontSize: 12 },
  listItemInfo: { flex: 1, marginLeft: 12 },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  listItemSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  listItemStats: { alignItems: 'flex-end' },
  listItemValue: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  listItemLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
