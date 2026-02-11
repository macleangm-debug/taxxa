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
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';

const isWeb = Platform.OS === 'web';

export default function FraudDetection() {
  const { suspiciousUsers, fetchSuspiciousUsers, updateUserStatus } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  if (isLoading) {
    return (
      <AdminLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </AdminLayout>
    );
  }

  const renderTableRow = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
      <View style={styles.userCell}>
        <View style={styles.warningIcon}>
          <Ionicons name="warning" size={18} color="#F59E0B" />
        </View>
        <View>
          <Text style={styles.userName}>{item.name || 'Anonymous'}</Text>
          <Text style={styles.userPhone}>{item.phone_number}</Text>
        </View>
      </View>
      <View style={styles.tableCell}>
        <View style={styles.flagsRow}>
          {item.flags.rapid_scans && (
            <View style={styles.flagBadge}>
              <Ionicons name="flash" size={12} color="#EF4444" />
            </View>
          )}
          {item.flags.high_duplicate_rate && (
            <View style={styles.flagBadge}>
              <Ionicons name="copy" size={12} color="#F59E0B" />
            </View>
          )}
          {item.flags.unusual_volume && (
            <View style={styles.flagBadge}>
              <Ionicons name="trending-up" size={12} color="#8B5CF6" />
            </View>
          )}
        </View>
      </View>
      <Text style={styles.tableCell}>{item.metrics.scans_24h}</Text>
      <Text style={styles.tableCell}>{item.metrics.rapid_scan_count}</Text>
      <Text style={styles.tableCell}>{item.metrics.duplicate_rate}%</Text>
      <View style={styles.tableCell}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'flagged' ? '#FEF3C7' : '#ECFDF5' }]}>
          <Text style={[styles.statusText, { color: item.status === 'flagged' ? '#92400E' : '#10B981' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.actionCell}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleAction(item.user_id, 'flagged')}>
            <Ionicons name="flag" size={16} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleAction(item.user_id, 'blocked')}>
            <Ionicons name="ban" size={16} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleAction(item.user_id, 'active')}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const content = (
    <View style={styles.content}>
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoIconWrapper}>
          <Ionicons name="information-circle" size={20} color="#2563EB" />
        </View>
        <Text style={styles.infoText}>Users flagged based on suspicious scanning behavior in the last 24 hours</Text>
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>User</Text>
          <Text style={styles.tableHeaderCell}>Flags</Text>
          <Text style={styles.tableHeaderCell}>Scans</Text>
          <Text style={styles.tableHeaderCell}>Rapid</Text>
          <Text style={styles.tableHeaderCell}>Dup %</Text>
          <Text style={styles.tableHeaderCell}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Actions</Text>
        </View>
        
        <FlatList
          data={suspiciousUsers}
          renderItem={renderTableRow}
          keyExtractor={(item) => item.user_id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shield-checkmark" size={48} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>No suspicious activity detected in the last 24 hours</Text>
            </View>
          }
        />
      </View>

      {/* Legend */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Flag Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="flash" size={14} color="#EF4444" />
            </View>
            <Text style={styles.legendText}>Rapid Scanning</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="copy" size={14} color="#F59E0B" />
            </View>
            <Text style={styles.legendText}>High Duplicate Rate</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="trending-up" size={14} color="#8B5CF6" />
            </View>
            <Text style={styles.legendText}>Unusual Volume</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="Fraud Detection" 
        subtitle={`${suspiciousUsers.length} suspicious users`}
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
  content: {
    flex: 1,
    padding: 32,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '500',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  userCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  userPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  flagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  flagBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionCell: {
    flex: 0.8,
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  emptyState: {
    padding: 80,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  legendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 13,
    color: '#475569',
  },
});
