import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';

const isWeb = Platform.OS === 'web';

export default function AnalyticsScreen() {
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

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const maxScans = Math.max(...scansByDay.map(d => d.total), 1);

  if (isLoading) {
    return (
      <AdminLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </AdminLayout>
    );
  }

  const content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="scan" size={24} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>{scansByDay.reduce((sum, d) => sum + d.total, 0)}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{scansByDay.reduce((sum, d) => sum + d.valid, 0)}</Text>
          <Text style={styles.statLabel}>Valid Scans</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="people" size={24} color="#8B5CF6" />
          </View>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{usersByDay.reduce((sum, d) => sum + d.count, 0)}</Text>
          <Text style={styles.statLabel}>New Users</Text>
        </View>
      </View>

      {/* Scans Chart */}
      <View style={styles.chartCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="bar-chart" size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Scans Overview</Text>
            <Text style={styles.cardSubtitle}>Last 7 days activity</Text>
          </View>
        </View>
        <View style={styles.chart}>
          {scansByDay.slice(-7).map((day, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, styles.barValid, { height: `${(day.valid / maxScans) * 100}%` }]} />
                <View style={[styles.bar, styles.barInvalid, { height: `${((day.invalid + day.duplicate) / maxScans) * 100}%` }]} />
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

      {/* Lists Row */}
      <View style={styles.listsRow}>
        {/* Top Merchants */}
        <View style={styles.listCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="storefront" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Top Merchants</Text>
              <Text style={styles.cardSubtitle}>By scan volume</Text>
            </View>
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
              <Text style={styles.listItemValue}>${merchant.total_amount?.toLocaleString()}</Text>
            </View>
          ))}
          {merchants.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>

        {/* Top Users */}
        <View style={styles.listCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="trophy" size={20} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Top Users</Text>
              <Text style={styles.cardSubtitle}>By entries earned</Text>
            </View>
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
              <View style={styles.entriesBadge}>
                <Text style={styles.entriesText}>{user.total_entries} entries</Text>
              </View>
            </View>
          ))}
          {topUsers.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
        </View>
      </View>

      {/* Detailed Table */}
      <View style={styles.tableCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="calendar" size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Daily Breakdown</Text>
            <Text style={styles.cardSubtitle}>Last 14 days</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
            <Text style={styles.tableHeaderCell}>Total</Text>
            <Text style={styles.tableHeaderCell}>Valid</Text>
            <Text style={styles.tableHeaderCell}>Invalid</Text>
            <Text style={styles.tableHeaderCell}>Duplicate</Text>
          </View>
          {scansByDay.map((day, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{day.date}</Text>
              <Text style={[styles.tableCell, { fontWeight: '600' }]}>{day.total}</Text>
              <Text style={[styles.tableCell, { color: '#10B981' }]}>{day.valid}</Text>
              <Text style={[styles.tableCell, { color: '#EF4444' }]}>{day.invalid}</Text>
              <Text style={[styles.tableCell, { color: '#F59E0B' }]}>{day.duplicate}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="Analytics" 
        subtitle="Performance insights and trends"
      />
      {content}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingBottom: 48,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 140,
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    width: 32,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValid: {
    backgroundColor: '#10B981',
  },
  barInvalid: {
    backgroundColor: '#EF4444',
    marginTop: 2,
  },
  barLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#64748B',
  },
  listsRow: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 20,
    marginBottom: 24,
  },
  listCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRank: {
    backgroundColor: '#FEF3C7',
  },
  rankText: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 13,
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listItemValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  entriesBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  entriesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  table: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
});
