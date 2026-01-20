import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1200;

export default function FraudDetection() {
  const router = useRouter();
  const { suspiciousUsers, fetchSuspiciousUsers, updateUserStatus } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadData = useCallback(async () => {
    try {
      await fetchSuspiciousUsers();
    } catch (error) {
      console.error('Error loading suspicious users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSuspiciousUsers]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleAction = (userId: string, action: string) => {
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'blocked' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateUserStatus(userId, action, 'Fraud detection');
              Alert.alert('Success', `User ${action}`);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to update');
            }
          },
        },
      ]
    );
  };

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

  const renderUserCard = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.userName}>{item.name || 'Anonymous'}</Text>
            <Text style={styles.userPhone}>{item.phone_number}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'flagged' ? '#FEF3C7' : '#ECFDF5' }]}>
          <Text style={[styles.statusText, { color: item.status === 'flagged' ? '#92400E' : '#10B981' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.flagsContainer}>
        <Text style={styles.flagsTitle}>Detected Issues</Text>
        <View style={styles.flagsList}>
          {item.flags.rapid_scans && (
            <View style={styles.flagItem}>
              <Ionicons name="flash" size={14} color="#EF4444" />
              <Text style={styles.flagText}>Rapid Scanning</Text>
            </View>
          )}
          {item.flags.high_duplicate_rate && (
            <View style={styles.flagItem}>
              <Ionicons name="copy" size={14} color="#F59E0B" />
              <Text style={styles.flagText}>High Duplicates</Text>
            </View>
          )}
          {item.flags.unusual_volume && (
            <View style={styles.flagItem}>
              <Ionicons name="trending-up" size={14} color="#8B5CF6" />
              <Text style={styles.flagText}>Unusual Volume</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{item.metrics.scans_24h}</Text>
          <Text style={styles.metricLabel}>Scans (24h)</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{item.metrics.rapid_scan_count}</Text>
          <Text style={styles.metricLabel}>Rapid</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{item.metrics.duplicate_rate}%</Text>
          <Text style={styles.metricLabel}>Dup Rate</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{item.metrics.volume_ratio}x</Text>
          <Text style={styles.metricLabel}>Volume</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {item.status !== 'flagged' && (
          <TouchableOpacity style={[styles.actionBtn, styles.flagBtn]} onPress={() => handleAction(item.user_id, 'flagged')}>
            <Ionicons name="flag" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Flag</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.blockBtn]} onPress={() => handleAction(item.user_id, 'blocked')}>
          <Ionicons name="ban" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Block</Text>
        </TouchableOpacity>
        {item.status !== 'active' && (
          <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={() => handleAction(item.user_id, 'active')}>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTableRow = ({ item }: { item: any }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, { flex: 2 }]}>
        <Text style={styles.tableCellName}>{item.name || 'Anonymous'}</Text>
        <Text style={styles.tableCellPhone}>{item.phone_number}</Text>
      </View>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.metrics.scans_24h}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.metrics.rapid_scan_count}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.metrics.duplicate_rate}%</Text>
      <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
        <View style={[styles.statusBadgeSmall, { backgroundColor: item.status === 'flagged' ? '#FEF3C7' : '#ECFDF5' }]}>
          <Text style={[styles.statusTextSmall, { color: item.status === 'flagged' ? '#92400E' : '#10B981' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'flex-end' }]}>
        <TouchableOpacity onPress={() => handleAction(item.user_id, 'flagged')}>
          <Ionicons name="flag" size={18} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleAction(item.user_id, 'blocked')}>
          <Ionicons name="ban" size={18} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleAction(item.user_id, 'active')}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>User</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Scans</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Rapid</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Dup %</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Status</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Actions</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Fraud Detection</Text>
            <Text style={styles.headerSubtitle}>Monitor suspicious activity</Text>
          </View>
          <ViewToggle />
        </View>
      </View>

      <View style={styles.infoBannerWrapper}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color="#2563EB" />
          <Text style={styles.infoText}>Users flagged based on scanning behavior in the last 24 hours</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <View style={styles.listWrapper}>
          {viewMode === 'table' && suspiciousUsers.length > 0 && <TableHeader />}
          <FlatList
            data={suspiciousUsers}
            renderItem={viewMode === 'cards' ? renderUserCard : renderTableRow}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="shield-checkmark" size={48} color="#10B981" />
                </View>
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptyText}>No suspicious activity detected</Text>
              </View>
            }
          />
        </View>
      )}
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
  
  viewToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 2 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  
  infoBannerWrapper: { alignItems: isWeb ? 'center' : undefined },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 12, marginHorizontal: 20, marginTop: 16, borderRadius: 10, gap: 10, maxWidth: MAX_WIDTH - 40, width: isWeb ? '100%' : undefined },
  infoText: { flex: 1, color: '#1D4ED8', fontSize: 13 },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listWrapper: { flex: 1, alignItems: isWeb ? 'center' : undefined },
  listContent: { padding: 20, width: '100%', maxWidth: MAX_WIDTH },
  
  userCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  warningIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  
  flagsContainer: { marginBottom: 12 },
  flagsTitle: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  flagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  flagText: { fontSize: 12, color: '#374151' },
  
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 12 },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  metricLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  flagBtn: { backgroundColor: '#F59E0B' },
  blockBtn: { backgroundColor: '#EF4444' },
  clearBtn: { backgroundColor: '#10B981' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', maxWidth: MAX_WIDTH, width: '100%' },
  tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  tableCell: { fontSize: 14, color: '#111827' },
  tableCellName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  tableCellPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusTextSmall: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#10B981', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
