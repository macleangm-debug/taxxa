import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1200;

export default function AnalyticsScreen() {
  const router = useRouter();
  const { fetchAnalytics } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [scansByDay, setScansByDay] = useState<any[]>([]);
  const [usersByDay, setUsersByDay] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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

  const ViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleBtnActive]} onPress={() => setViewMode('cards')}>
        <Ionicons name="grid" size={16} color={viewMode === 'cards' ? '#fff' : '#6B7280'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]} onPress={() => setViewMode('table')}>
        <Ionicons name="list" size={16} color={viewMode === 'table' ? '#fff' : '#6B7280'} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analytics</Text>
          </View>
        </View>
        <View style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Performance overview</Text>
          </View>
          <ViewToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          {viewMode === 'cards' ? (
            <>
              {/* Summary Stats */}
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Ionicons name="scan" size={24} color="#2563EB" />
                  <Text style={styles.summaryValue}>{scansByDay.reduce((sum, d) => sum + d.total, 0)}</Text>
                  <Text style={styles.summaryLabel}>Total Scans</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>{scansByDay.reduce((sum, d) => sum + d.valid, 0)}</Text>
                  <Text style={styles.summaryLabel}>Valid</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Ionicons name="people" size={24} color="#8B5CF6" />
                  <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{usersByDay.reduce((sum, d) => sum + d.count, 0)}</Text>
                  <Text style={styles.summaryLabel}>New Users</Text>
                </View>
              </View>

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
                    <Text style={styles.legendText}>Invalid/Dup</Text>
                  </View>
                </View>
              </View>

              {/* Lists Side by Side on Web */}
              <View style={styles.listsContainer}>
                {/* Top Merchants */}
                <View style={[styles.listCard, isWeb && { flex: 1 }]}>
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
                      </View>
                    </View>
                  ))}
                  {merchants.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
                </View>

                {/* Top Users */}
                <View style={[styles.listCard, isWeb && { flex: 1 }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="trophy" size={18} color="#8B5CF6" />
                    </View>
                    <Text style={styles.cardTitle}>Top Users</Text>
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
                        <Text style={[styles.listItemValue, { color: '#8B5CF6' }]}>{user.total_entries}</Text>
                        <Text style={styles.listItemLabel}>entries</Text>
                      </View>
                    </View>
                  ))}
                  {topUsers.length === 0 && <Text style={styles.emptyText}>No data yet</Text>}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Table View - Scans by Day */}
              <View style={styles.tableCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Scans by Day (14 Days)</Text>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Total</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Valid</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Invalid</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Duplicate</Text>
                </View>
                {scansByDay.map((day, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{day.date}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontWeight: '600' }]}>{day.total}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: '#10B981' }]}>{day.valid}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: '#EF4444' }]}>{day.invalid}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: '#F59E0B' }]}>{day.duplicate}</Text>
                  </View>
                ))}
              </View>

              {/* Table View - Merchants */}
              <View style={styles.tableCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Merchants</Text>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Merchant</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Scans</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Entries</Text>
                </View>
                {merchants.map((merchant, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{index + 1}</Text>
                    <Text style={[styles.tableCell, { flex: 3, fontWeight: '500' }]}>{merchant.merchant_name}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{merchant.total_scans}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: '#10B981' }]}>${merchant.total_amount.toLocaleString()}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{merchant.total_entries}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, maxWidth: MAX_WIDTH, alignSelf: 'center', width: '100%' },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  viewToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 2 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  
  scrollContent: { paddingVertical: 20, alignItems: isWeb ? 'center' : undefined },
  contentContainer: { width: '100%', maxWidth: MAX_WIDTH, paddingHorizontal: 20 },
  
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '700', color: '#111827', marginTop: 8 },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  tableCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 120, alignItems: 'flex-end' },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 100, width: 24, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barValid: { backgroundColor: '#10B981' },
  barInvalid: { backgroundColor: '#EF4444', marginTop: 2 },
  barLabel: { fontSize: 10, color: '#6B7280', marginTop: 6 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#6B7280' },
  
  listsContainer: { flexDirection: isWeb ? 'row' : 'column', gap: 16 },
  
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
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  tableCell: { fontSize: 14, color: '#111827' },
});
