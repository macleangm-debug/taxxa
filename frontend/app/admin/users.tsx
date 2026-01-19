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
const isDesktop = Platform.OS === 'web' && width > 768;

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

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleUserPress(item)}>
      <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + '20' }]}>
        <Ionicons name="person" size={22} color={getStatusColor(item.status)} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'No Name'}</Text>
        <Text style={styles.userPhone}>{item.phone_number}</Text>
      </View>
      <View style={styles.userStatsContainer}>
        <View style={styles.userStat}>
          <Ionicons name="scan" size={14} color="#64748B" />
          <Text style={styles.userStatText}>{item.total_scans} scans</Text>
        </View>
        <View style={styles.userStat}>
          <Ionicons name="ticket" size={14} color="#64748B" />
          <Text style={styles.userStatText}>{item.total_entries} entries</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>{pagination.total} total users</Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by phone or name..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); loadUsers(1); }}>
              <Ionicons name="close-circle" size={20} color="#64748B" />
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

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>User</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Activity</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
        <Text style={[styles.tableHeaderText, { width: 30 }]}></Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, pagination.page === 1 && styles.pageBtnDisabled]}
            onPress={() => loadUsers(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.pageText}>Page {pagination.page} of {pagination.pages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, pagination.page === pagination.pages && styles.pageBtnDisabled]}
            onPress={() => loadUsers(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* User Details Modal */}
      <Modal visible={showModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setUserDetails(null); }}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {userDetails ? (
              <View style={styles.modalBody}>
                {/* User Info */}
                <View style={styles.userInfoSection}>
                  <View style={[styles.modalAvatar, { backgroundColor: getStatusColor(userDetails.user.status) + '20' }]}>
                    <Ionicons name="person" size={32} color={getStatusColor(userDetails.user.status)} />
                  </View>
                  <View style={styles.userInfoDetails}>
                    <Text style={styles.modalUserName}>{userDetails.user.name || 'Anonymous'}</Text>
                    <Text style={styles.modalUserPhone}>{userDetails.user.phone_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userDetails.user.status) + '20', marginTop: 8 }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(userDetails.user.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(userDetails.user.status) }]}>
                        {userDetails.user.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Ionicons name="scan" size={20} color="#3B82F6" />
                    <Text style={styles.statNumber}>{userDetails.user.total_scans}</Text>
                    <Text style={styles.statLabel}>Total Scans</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.statNumber}>{userDetails.user.valid_scans}</Text>
                    <Text style={styles.statLabel}>Valid Scans</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="ticket" size={20} color="#F59E0B" />
                    <Text style={styles.statNumber}>{userDetails.user.total_entries}</Text>
                    <Text style={styles.statLabel}>Entries</Text>
                  </View>
                </View>

                {/* Fraud Indicators */}
                {userDetails.fraud_indicators && (
                  <View style={styles.fraudSection}>
                    <Text style={styles.fraudTitle}>
                      <Ionicons name="warning" size={16} color="#F59E0B" /> Fraud Indicators
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

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {userDetails.user.status !== 'active' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.activateBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'active')}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Activate</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'flagged' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.flagBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'flagged')}
                    >
                      <Ionicons name="flag" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Flag</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'blocked' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.blockBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'blocked')}
                    >
                      <Ionicons name="ban" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Block</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40, marginBottom: 40 }} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#1E293B' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16 
  },
  headerTitleContainer: {},
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  
  controlsBar: { 
    paddingHorizontal: 24, 
    paddingVertical: 16,
    flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1E293B', 
    borderRadius: 10, 
    paddingHorizontal: 14,
    height: 44,
    flex: Platform.OS === 'web' && width > 768 ? 1 : undefined,
    maxWidth: Platform.OS === 'web' ? 400 : undefined,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#fff' },
  filterContainer: { flexDirection: 'row', gap: 8 },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1E293B' },
  filterActive: { backgroundColor: '#3B82F6' },
  filterText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
  },
  tableHeaderText: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 24, paddingVertical: 8 },
  
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  userInfo: { flex: 2, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  userPhone: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  userStatsContainer: { flex: 1.5, flexDirection: 'row', gap: 16 },
  userStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userStatText: { fontSize: 13, color: '#94A3B8' },
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
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  
  pagination: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16, 
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  pageBtn: { backgroundColor: '#3B82F6', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: '#374151' },
  pageText: { color: '#94A3B8', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { 
    backgroundColor: '#1E293B', 
    borderRadius: 20, 
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
    borderBottomColor: '#334155',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalBody: { padding: 20 },
  
  userInfoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalAvatar: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  userInfoDetails: { marginLeft: 16, flex: 1 },
  modalUserName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  modalUserPhone: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  
  statsGrid: { 
    flexDirection: 'row', 
    backgroundColor: '#0F172A', 
    borderRadius: 12, 
    padding: 16,
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  
  fraudSection: { 
    backgroundColor: '#422006', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 16 
  },
  fraudTitle: { fontSize: 13, fontWeight: '600', color: '#FCD34D', marginBottom: 10 },
  fraudGrid: { flexDirection: 'row' },
  fraudItem: { flex: 1, alignItems: 'center' },
  fraudValue: { fontSize: 18, fontWeight: 'bold', color: '#FEF3C7' },
  fraudLabel: { fontSize: 11, color: '#FCD34D' },
  
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
