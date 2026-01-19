import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';
import { format } from 'date-fns';

export default function ScansManagement() {
  const router = useRouter();
  const { scans, fetchScans } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const loadScans = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await fetchScans(page, 50, statusFilter);
      setPagination({ page: data.pagination.page, pages: data.pagination.pages });
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchScans, statusFilter]);

  useEffect(() => {
    loadScans();
  }, [statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return { name: 'checkmark-circle', color: '#10B981' };
      case 'duplicate': return { name: 'copy', color: '#F59E0B' };
      case 'invalid': return { name: 'close-circle', color: '#EF4444' };
      default: return { name: 'help-circle', color: '#64748B' };
    }
  };

  const renderScan = ({ item }: { item: any }) => {
    const icon = getStatusIcon(item.status);
    
    return (
      <View style={styles.scanCard}>
        <View style={[styles.statusIcon, { backgroundColor: `${icon.color}20` }]}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        
        <View style={styles.scanInfo}>
          <Text style={styles.merchantName}>{item.merchant_name || 'Unknown'}</Text>
          <Text style={styles.receiptId}>{item.receipt_id?.substring(0, 20) || 'N/A'}</Text>
          <Text style={styles.timestamp}>
            {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        
        <View style={styles.scanStats}>
          {item.amount && <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>}
          {item.status === 'valid' && (
            <Text style={styles.entries}>+{item.entries_earned} entries</Text>
          )}
          <Text style={[styles.status, { color: icon.color }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Records</Text>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {['all', 'valid', 'invalid', 'duplicate'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              (statusFilter === status || (status === 'all' && !statusFilter)) && styles.filterActive
            ]}
            onPress={() => setStatusFilter(status === 'all' ? undefined : status)}
          >
            <Text style={[
              styles.filterText,
              (statusFilter === status || (status === 'all' && !statusFilter)) && styles.filterTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderScan}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No scans found</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
            onPress={() => loadScans(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.pageText}>Page {pagination.page} of {pagination.pages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, pagination.page === pagination.pages && styles.pageBtnDisabled]}
            onPress={() => loadScans(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B' },
  filterActive: { backgroundColor: '#3B82F6' },
  filterText: { color: '#94A3B8', fontSize: 14 },
  filterTextActive: { color: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  scanCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scanInfo: { flex: 1, marginLeft: 12 },
  merchantName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  receiptId: { fontSize: 12, color: '#64748B', marginTop: 2 },
  timestamp: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  scanStats: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '600', color: '#fff' },
  entries: { fontSize: 12, color: '#10B981', marginTop: 2 },
  status: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 16 },
  pageBtn: { backgroundColor: '#3B82F6', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: '#374151' },
  pageText: { color: '#94A3B8', fontSize: 14 },
});
