import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1200;

export default function UsersManagement() {
  const router = useRouter();
  const { users, fetchUsers, fetchUserDetails, updateUserStatus } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await fetchUsers(page, 20, statusFilter, search || undefined);
      setPagination({ page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total });
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers, statusFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const handleSearch = () => {
    loadUsers(1);
  };

  const handleUserPress = async (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
    try {
      const details = await fetchUserDetails(user.id);
      setUserDetails(details);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${newStatus} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'blocked' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateUserStatus(userId, newStatus);
              setShowModal(false);
              loadUsers(pagination.page);
              Alert.alert('Success', `User ${newStatus} successfully`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'flagged': return '#F59E0B';
      case 'blocked': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const ViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleBtnActive]}
        onPress={() => setViewMode('cards')}
      >
        <Ionicons name="grid" size={16} color={viewMode === 'cards' ? '#fff' : '#6B7280'} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
        onPress={() => setViewMode('table')}
      >
        <Ionicons name="list" size={16} color={viewMode === 'table' ? '#fff' : '#6B7280'} />
      </TouchableOpacity>
    </View>
  );

  const renderUserCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleUserPress(item)}>
      <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + '15' }]}>
        <Ionicons name="person" size={20} color={getStatusColor(item.status)} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'No Name'}</Text>
        <Text style={styles.userPhone}>{item.phone_number}</Text>
      </View>
      <View style={styles.userStatsContainer}>
        <View style={styles.userStat}>
          <Ionicons name="scan" size={14} color="#6B7280" />
          <Text style={styles.userStatText}>{item.total_scans}</Text>
        </View>
        <View style={styles.userStat}>
          <Ionicons name="ticket" size={14} color="#6B7280" />
          <Text style={styles.userStatText}>{item.total_entries}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderTableRow = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.tableRow} onPress={() => handleUserPress(item)}>
      <View style={[styles.tableCell, { flex: 2 }]}>
        <Text style={styles.tableCellName}>{item.name || 'No Name'}</Text>
        <Text style={styles.tableCellPhone}>{item.phone_number}</Text>
      </View>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.total_scans}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.total_entries}</Text>
      <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
        <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusTextSmall, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>User</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Scans</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Entries</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Status</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Users</Text>
            <Text style={styles.headerSubtitle}>{pagination.total} total users</Text>
          </View>
          <ViewToggle />
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.controlsWrapper}>
        <View style={styles.controlsBar}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by phone or name..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); loadUsers(1); }}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filterContainer}>
            {['all', 'active', 'flagged', 'blocked'].map((status) => (
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
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <View style={styles.listWrapper}>
          {viewMode === 'table' && <TableHeader />}
          <FlatList
            data={users}
            renderItem={viewMode === 'cards' ? renderUserCard : renderTableRow}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <View style={styles.paginationWrapper}>
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
              onPress={() => loadUsers(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pageText}>Page {pagination.page} of {pagination.pages}</Text>
            <TouchableOpacity
              style={[styles.pageBtn, pagination.page === pagination.pages && styles.pageBtnDisabled]}
              onPress={() => loadUsers(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Details Modal */}
      <Modal visible={showModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setUserDetails(null); }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {userDetails ? (
              <View style={styles.modalBody}>
                <View style={styles.userInfoSection}>
                  <View style={[styles.modalAvatar, { backgroundColor: getStatusColor(userDetails.user.status) + '15' }]}>
                    <Ionicons name="person" size={28} color={getStatusColor(userDetails.user.status)} />
                  </View>
                  <View style={styles.userInfoDetails}>
                    <Text style={styles.modalUserName}>{userDetails.user.name || 'Anonymous'}</Text>
                    <Text style={styles.modalUserPhone}>{userDetails.user.phone_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userDetails.user.status) + '15', marginTop: 8 }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(userDetails.user.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(userDetails.user.status) }]}>
                        {userDetails.user.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Ionicons name="scan" size={18} color="#2563EB" />
                    <Text style={styles.statNumber}>{userDetails.user.total_scans}</Text>
                    <Text style={styles.statLabel}>Total Scans</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.statNumber}>{userDetails.user.valid_scans}</Text>
                    <Text style={styles.statLabel}>Valid Scans</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="ticket" size={18} color="#F59E0B" />
                    <Text style={styles.statNumber}>{userDetails.user.total_entries}</Text>
                    <Text style={styles.statLabel}>Entries</Text>
                  </View>
                </View>

                {userDetails.fraud_indicators && (
                  <View style={styles.fraudSection}>
                    <Text style={styles.fraudTitle}>
                      <Ionicons name="warning" size={14} color="#F59E0B" /> Fraud Indicators
                    </Text>
                    <View style={styles.fraudGrid}>
                      <View style={styles.fraudItem}>
                        <Text style={styles.fraudValue}>{userDetails.fraud_indicators.rapid_scans}</Text>
                        <Text style={styles.fraudLabel}>Rapid Scans</Text>
                      </View>
                      <View style={styles.fraudItem}>
                        <Text style={styles.fraudValue}>{userDetails.fraud_indicators.duplicate_attempts}</Text>
                        <Text style={styles.fraudLabel}>Duplicates</Text>
                      </View>
                      <View style={styles.fraudItem}>
                        <Text style={styles.fraudValue}>{userDetails.fraud_indicators.invalid_attempts}</Text>
                        <Text style={styles.fraudLabel}>Invalid</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  {userDetails.user.status !== 'active' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.activateBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'active')}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Activate</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'flagged' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.flagBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'flagged')}
                    >
                      <Ionicons name="flag" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Flag</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'blocked' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.blockBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'blocked')}
                    >
                      <Ionicons name="ban" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Block</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40, marginBottom: 40 }} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
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
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  
  viewToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 2 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  
  controlsWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  controlsBar: { 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    flexDirection: isWeb ? 'row' : 'column',
    gap: 12,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    borderRadius: 10, 
    paddingHorizontal: 14,
    height: 44,
    flex: isWeb ? 1 : undefined,
    maxWidth: isWeb ? 400 : undefined,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },
  filterContainer: { flexDirection: 'row', gap: 8 },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  filterActive: { backgroundColor: '#2563EB' },
  filterText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listWrapper: { flex: 1, alignItems: isWeb ? 'center' : undefined },
  listContent: { padding: 20, width: '100%', maxWidth: MAX_WIDTH },
  
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  avatar: { 
    width: 42, 
    height: 42, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  userInfo: { flex: 2, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  userStatsContainer: { flex: 1.5, flexDirection: 'row', gap: 16 },
  userStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userStatText: { fontSize: 13, color: '#6B7280' },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
    gap: 6,
    marginRight: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    maxWidth: MAX_WIDTH,
    width: '100%',
  },
  tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableCell: { fontSize: 14, color: '#111827' },
  tableCellName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  tableCellPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusTextSmall: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#6B7280', fontSize: 16, marginTop: 12 },
  
  paginationWrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  pagination: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    gap: 16,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  pageBtn: { backgroundColor: '#2563EB', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: '#D1D5DB' },
  pageText: { color: '#6B7280', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    width: '100%', 
    maxWidth: 480,
    maxHeight: '90%',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { padding: 20 },
  
  userInfoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalAvatar: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  userInfoDetails: { marginLeft: 16, flex: 1 },
  modalUserName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalUserPhone: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  
  statsGrid: { 
    flexDirection: 'row', 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    padding: 16,
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280' },
  
  fraudSection: { 
    backgroundColor: '#FEF3C7', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 16 
  },
  fraudTitle: { fontSize: 13, fontWeight: '600', color: '#92400E', marginBottom: 10 },
  fraudGrid: { flexDirection: 'row' },
  fraudItem: { flex: 1, alignItems: 'center' },
  fraudValue: { fontSize: 18, fontWeight: '700', color: '#92400E' },
  fraudLabel: { fontSize: 11, color: '#B45309' },
  
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 10, 
    gap: 6 
  },
  activateBtn: { backgroundColor: '#10B981' },
  flagBtn: { backgroundColor: '#F59E0B' },
  blockBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
