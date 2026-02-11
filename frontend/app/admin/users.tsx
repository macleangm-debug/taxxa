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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';

const isWeb = Platform.OS === 'web';

export default function UsersManagement() {
  const { users, fetchUsers, fetchUserDetails, updateUserStatus } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

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
      default: return '#64748B';
    }
  };

  const renderUser = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]} 
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userCell}>
        <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.avatarText, { color: getStatusColor(item.status) }]}>
            {(item.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.userPhone}>{item.phone_number}</Text>
        </View>
      </View>
      <Text style={styles.tableCell}>{item.total_scans}</Text>
      <Text style={styles.tableCell}>{item.total_entries}</Text>
      <View style={styles.tableCell}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.actionCell}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="eye-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const content = (
    <View style={styles.content}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or phone..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
        </View>
        <View style={styles.filterTabs}>
          {['all', 'active', 'flagged', 'blocked'].map((status) => (
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
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>User</Text>
          <Text style={styles.tableHeaderCell}>Scans</Text>
          <Text style={styles.tableHeaderCell}>Entries</Text>
          <Text style={styles.tableHeaderCell}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
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
              onPress={() => loadUsers(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={18} color={pagination.page === 1 ? '#CBD5E1' : '#475569'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageBtn, pagination.page === pagination.pages && styles.pageBtnDisabled]}
              onPress={() => loadUsers(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <Ionicons name="chevron-forward" size={18} color={pagination.page === pagination.pages ? '#CBD5E1' : '#475569'} />
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
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {userDetails ? (
              <View style={styles.modalBody}>
                <View style={styles.userProfile}>
                  <View style={[styles.modalAvatar, { backgroundColor: getStatusColor(userDetails.user.status) + '20' }]}>
                    <Text style={[styles.modalAvatarText, { color: getStatusColor(userDetails.user.status) }]}>
                      {(userDetails.user.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.modalUserName}>{userDetails.user.name || 'Unknown'}</Text>
                    <Text style={styles.modalUserPhone}>{userDetails.user.phone_number}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userDetails.user.status) + '15', marginLeft: 'auto' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(userDetails.user.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(userDetails.user.status) }]}>
                      {userDetails.user.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{userDetails.user.total_scans}</Text>
                    <Text style={styles.statLabel}>Total Scans</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{userDetails.user.valid_scans}</Text>
                    <Text style={styles.statLabel}>Valid</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{userDetails.user.total_entries}</Text>
                    <Text style={styles.statLabel}>Entries</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  {userDetails.user.status !== 'active' && (
                    <TouchableOpacity style={[styles.modalBtn, styles.activateBtn]} onPress={() => handleStatusChange(userDetails.user.id, 'active')}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.modalBtnText}>Activate</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'flagged' && (
                    <TouchableOpacity style={[styles.modalBtn, styles.flagBtn]} onPress={() => handleStatusChange(userDetails.user.id, 'flagged')}>
                      <Ionicons name="flag" size={18} color="#fff" />
                      <Text style={styles.modalBtnText}>Flag</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'blocked' && (
                    <TouchableOpacity style={[styles.modalBtn, styles.blockBtn]} onPress={() => handleStatusChange(userDetails.user.id, 'blocked')}>
                      <Ionicons name="ban" size={18} color="#fff" />
                      <Text style={styles.modalBtnText}>Block</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#2563EB" style={{ padding: 40 }} />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="Users" 
        subtitle={`${pagination.total} total users`}
        rightContent={
          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={18} color="#475569" />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        }
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
    gap: 16,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E293B',
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
  userCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  actionCell: {
    flex: 0.5,
    alignItems: 'flex-end',
  },
  actionBtn: {
    padding: 8,
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exportBtnText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalBody: {
    padding: 24,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 22,
    fontWeight: '600',
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalUserPhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  activateBtn: { backgroundColor: '#10B981' },
  flagBtn: { backgroundColor: '#F59E0B' },
  blockBtn: { backgroundColor: '#EF4444' },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
