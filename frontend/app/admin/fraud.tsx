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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

export default function FraudDetection() {
  const router = useRouter();
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleAction = (userId: string, action: string) => {
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'blocked' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateUserStatus(userId, action, 'Flagged by fraud detection');
              Alert.alert('Success', `User ${action} successfully`);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || 'Anonymous'}</Text>
            <Text style={styles.userPhone}>{item.phone_number}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'flagged' ? '#FEF3C7' : '#ECFDF5' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'flagged' ? '#92400E' : '#10B981' }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Fraud Flags */}
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

      {/* Metrics */}
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

      {/* Actions */}
      <View style={styles.actions}>
        {item.status !== 'flagged' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.flagBtn]}
            onPress={() => handleAction(item.user_id, 'flagged')}
          >
            <Ionicons name="flag" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Flag</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.blockBtn]}
          onPress={() => handleAction(item.user_id, 'blocked')}
        >
          <Ionicons name="ban" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Block</Text>
        </TouchableOpacity>
        {item.status !== 'active' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.clearBtn]}
            onPress={() => handleAction(item.user_id, 'active')}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Fraud Detection</Text>
          <Text style={styles.headerSubtitle}>Monitor suspicious activity</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color="#2563EB" />
        <Text style={styles.infoText}>
          Users flagged based on scanning behavior in the last 24 hours
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={suspiciousUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
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
      )}
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
  
  infoBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EFF6FF', 
    padding: 12, 
    marginHorizontal: 20, 
    marginTop: 16, 
    borderRadius: 10, 
    gap: 10 
  },
  infoText: { flex: 1, color: '#1D4ED8', fontSize: 13 },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  
  userCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: '#F59E0B' 
  },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  warningIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#FEF3C7', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  userDetails: {},
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  
  flagsContainer: { marginBottom: 12 },
  flagsTitle: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  flagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flagText: { fontSize: 12, color: '#374151' },
  
  metricsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#F9FAFB', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 12 
  },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  metricLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    borderRadius: 8, 
    gap: 6 
  },
  flagBtn: { backgroundColor: '#F59E0B' },
  blockBtn: { backgroundColor: '#EF4444' },
  clearBtn: { backgroundColor: '#10B981' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#ECFDF5', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#10B981', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
