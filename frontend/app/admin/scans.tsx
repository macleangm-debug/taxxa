import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';
import { format } from 'date-fns';

const isWeb = Platform.OS === 'web';

export default function ScansManagement() {
  const { scans, fetchScans } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadScans = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await fetchScans(page, 50, statusFilter);
      setPagination({ page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total });
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

  const renderTableRow = ({ item, index }: { item: any; index: number }) => {
    const icon = getStatusIcon(item.status);
    
    return (
      <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
        <View style={styles.merchantCell}>
          <View style={[styles.statusIcon, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name as any} size={18} color={icon.color} />
          </View>
          <View>
            <Text style={styles.merchantName}>{item.merchant_name || 'Unknown'}</Text>
            <Text style={styles.receiptId}>{item.receipt_id?.substring(0, 20) || 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.tableCell}>
          {format(new Date(item.timestamp), 'MMM d, h:mm a')}
        </Text>
        <Text style={[styles.tableCell, { fontWeight: '600' }]}>
          {item.amount ? `$${item.amount.toFixed(2)}` : '-'}
        </Text>
        <Text style={[styles.tableCell, { color: '#10B981', fontWeight: '600' }]}>
          {item.status === 'valid' ? `+${item.entries_earned}` : '-'}
        </Text>
        <View style={styles.tableCell}>
          <View style={[styles.statusBadge, { backgroundColor: `${icon.color}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: icon.color }]} />
            <Text style={[styles.statusText, { color: icon.color }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  const content = (
    <View style={styles.content}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.filterTabs}>
          {['all', 'valid', 'invalid', 'duplicate'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                (statusFilter === status || (status === 'all' && !statusFilter)) && styles.filterTabActive
              ]}
              onPress={() => setStatusFilter(status === 'all' ? undefined : status)}
            >
              <Text style={[
                styles.filterTabText,
                (statusFilter === status || (status === 'all' && !statusFilter)) && styles.filterTabTextActive
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Merchant</Text>
          <Text style={styles.tableHeaderCell}>Date</Text>
          <Text style={styles.tableHeaderCell}>Amount</Text>
          <Text style={styles.tableHeaderCell}>Entries</Text>
          <Text style={styles.tableHeaderCell}>Status</Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={scans}
            renderItem={renderTableRow}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="scan-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No scans found</Text>
                <Text style={styles.emptyText}>Scans will appear here when users start scanning</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <View style={styles.pagination}>
          <Text style={styles.paginationText}>
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </Text>
          <View style={styles.paginationButtons}>
            <TouchableOpacity
              style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
              onPress={() => loadScans(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={18} color={pagination.page === 1 ? '#CBD5E1' : '#475569'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageBtn, pagination.page === pagination.pages && styles.pageBtnDisabled]}
              onPress={() => loadScans(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <Ionicons name="chevron-forward" size={18} color={pagination.page === pagination.pages ? '#CBD5E1' : '#475569'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="Scans" 
        subtitle={`${pagination.total} total scans`}
      />
      {content}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 32,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
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
  merchantCell: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  receiptId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  paginationText: {
    fontSize: 14,
    color: '#64748B',
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: {
    backgroundColor: '#F8FAFC',
  },
});
