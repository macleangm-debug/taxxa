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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

export default function UsersManagement() {
  const router = useRouter();
  const { users, fetchUsers, fetchUserDetails, updateUserStatus } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const loadUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await fetchUsers(page, 20, statusFilter, search || undefined);
      setPagination({ page: data.pagination.page, pages: data.pagination.pages });
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
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + '30' }]}>
          <Ionicons name="person" size={20} color={getStatusColor(item.status)} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name || 'No Name'}</Text>
          <Text style={styles.userPhone}>{item.phone_number}</Text>
        </View>
      </View>
      <View style={styles.userStats}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.entriesText}>{item.total_entries} entries</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="Search by phone or name"
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Status Filter */}
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

      {/* User Details Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setUserDetails(null); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {userDetails ? (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{userDetails.user.phone_number}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{userDetails.user.name || 'N/A'}</Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(userDetails.user.status) }]}>
                    {userDetails.user.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{userDetails.user.total_scans}</Text>
                    <Text style={styles.statLabel}>Scans</Text>
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

                {userDetails.fraud_indicators && (
                  <View style={styles.fraudSection}>
                    <Text style={styles.fraudTitle}>Fraud Indicators</Text>
                    <Text style={styles.fraudText}>
                      Rapid Scans: {userDetails.fraud_indicators.rapid_scans} | 
                      Duplicates: {userDetails.fraud_indicators.duplicate_attempts} | 
                      Invalid: {userDetails.fraud_indicators.invalid_attempts}
                    </Text>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  {userDetails.user.status !== 'active' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.activateBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'active')}
                    >
                      <Text style={styles.actionBtnText}>Activate</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'flagged' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.flagBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'flagged')}
                    >
                      <Text style={styles.actionBtnText}>Flag</Text>
                    </TouchableOpacity>
                  )}
                  {userDetails.user.status !== 'blocked' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.blockBtn]}
                      onPress={() => handleStatusChange(userDetails.user.id, 'blocked')}
                    >
                      <Text style={styles.actionBtnText}>Block</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#fff' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B' },
  filterActive: { backgroundColor: '#3B82F6' },
  filterText: { color: '#94A3B8', fontSize: 14 },
  filterTextActive: { color: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  userCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  userDetails: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  userPhone: { fontSize: 14, color: '#94A3B8' },
  userStats: { alignItems: 'flex-end', marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '600' },
  entriesText: { fontSize: 12, color: '#64748B', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  detailValue: { fontSize: 16, color: '#fff' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0F172A', borderRadius: 12, padding: 16, marginVertical: 16 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#3B82F6' },
  statLabel: { fontSize: 12, color: '#94A3B8' },
  fraudSection: { backgroundColor: '#7F1D1D', borderRadius: 12, padding: 12, marginBottom: 16 },
  fraudTitle: { fontSize: 14, fontWeight: '600', color: '#FCA5A5', marginBottom: 4 },
  fraudText: { fontSize: 12, color: '#FECACA' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  activateBtn: { backgroundColor: '#10B981' },
  flagBtn: { backgroundColor: '#F59E0B' },
  blockBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
});
