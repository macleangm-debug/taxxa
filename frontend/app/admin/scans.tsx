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
      default: return { name: 'help-circle', color: '#6B7280' };
    }
  };

  const renderScan = ({ item }: { item: any }) => {
    const icon = getStatusIcon(item.status);
    
    return (
      <View style={styles.scanCard}>
        <View style={[styles.statusIcon, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name as any} size={22} color={icon.color} />
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
          <View style={[styles.statusBadge, { backgroundColor: `${icon.color}15` }]}>
            <Text style={[styles.statusText, { color: icon.color }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Scans</Text>
          <Text style={styles.headerSubtitle}>All scan records</Text>
        </View>
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
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderScan}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={48} color="#9CA3AF" />
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
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.pageText}>Page {pagination.page} of {pagination.pages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, pagination.page === pagination.pages && styles.pageBtnDisabled]}
            onPress={() => loadScans(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
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
  
  filterContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  filterActive: { backgroundColor: '#2563EB' },
  filterText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  
  scanCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  statusIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  scanInfo: { flex: 1, marginLeft: 12 },
  merchantName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  receiptId: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  timestamp: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  scanStats: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '600', color: '#111827' },
  entries: { fontSize: 12, color: '#10B981', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6B7280', fontSize: 16, marginTop: 12 },
  
  pagination: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    gap: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pageBtn: { backgroundColor: '#2563EB', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: '#D1D5DB' },
  pageText: { color: '#6B7280', fontSize: 14 },
});
