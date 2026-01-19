import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import { format, formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

export default function DrawsManagement() {
  const router = useRouter();
  const { draws, fetchDraws, createDraw, completeDraw, cancelDraw } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [newDrawType, setNewDrawType] = useState('weekly');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const loadDraws = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDraws(statusFilter);
    } catch (error) {
      console.error('Error loading draws:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDraws, statusFilter]);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  const handleCreateDraw = async () => {
    const days = newDrawType === 'weekly' ? 7 : newDrawType === 'monthly' ? 30 : 90;
    try {
      await createDraw(newDrawType, days);
      setShowCreateModal(false);
      Alert.alert('Success', 'Draw created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create draw');
    }
  };

  const handleCompleteDraw = async (drawId: string) => {
    Alert.alert(
      'Complete Draw',
      'This will randomly select winners from all participants. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Winners',
          style: 'default',
          onPress: async () => {
            try {
              const result = await completeDraw(drawId);
              setWinners(result.winners);
              setShowWinnersModal(true);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to complete draw');
            }
          },
        },
      ]
    );
  };

  const handleCancelDraw = async (drawId: string) => {
    Alert.alert(
      'Cancel Draw',
      'Are you sure you want to cancel this draw? All entries will be lost.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDraw(drawId);
              Alert.alert('Success', 'Draw cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel draw');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getTotalPrize = (tiers: any[]) => {
    return tiers.reduce((sum, tier) => sum + (tier.amount * tier.winners), 0);
  };

  const filteredDraws = statusFilter 
    ? draws.filter(d => d.status === statusFilter)
    : draws;

  const renderDraw = ({ item }: { item: any }) => (
    <View style={styles.drawCard}>
      {/* Header */}
      <View style={styles.drawHeader}>
        <View style={styles.drawTitleSection}>
          <View style={[styles.drawIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="trophy" size={24} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.drawTypeName}>
              {item.draw_type.charAt(0).toUpperCase() + item.draw_type.slice(1)} Draw
            </Text>
            <Text style={styles.drawDates}>
              {format(new Date(item.start_date), 'MMM d')} - {format(new Date(item.end_date), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={18} color="#64748B" />
          <Text style={styles.statValue}>{item.participants}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="ticket" size={18} color="#64748B" />
          <Text style={styles.statValue}>{item.total_entries}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="cash" size={18} color="#64748B" />
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            ${getTotalPrize(item.prize_tiers).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Prize Pool</Text>
        </View>
        {item.status === 'active' && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={18} color="#64748B" />
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {formatDistanceToNow(new Date(item.end_date))}
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </>
        )}
      </View>

      {/* Prize Tiers */}
      <View style={styles.tiersSection}>
        <Text style={styles.sectionLabel}>Prize Tiers</Text>
        <View style={styles.tiersList}>
          {item.prize_tiers.map((tier: any, index: number) => (
            <View key={index} style={styles.tierRow}>
              <View style={styles.tierInfo}>
                <Ionicons 
                  name={tier.tier === 1 ? 'medal' : tier.tier === 2 ? 'ribbon' : 'star'} 
                  size={18} 
                  color={tier.tier === 1 ? '#F59E0B' : tier.tier === 2 ? '#94A3B8' : '#CD7F32'} 
                />
                <Text style={styles.tierName}>{tier.name}</Text>
              </View>
              <Text style={styles.tierAmount}>${tier.amount.toLocaleString()}</Text>
              <Text style={styles.tierWinners}>x{tier.winners}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Winners (if completed) */}
      {item.status === 'completed' && item.winners.length > 0 && (
        <View style={styles.winnersSection}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="trophy" size={14} color="#F59E0B" /> Winners
          </Text>
          {item.winners.map((winner: any, index: number) => (
            <View key={index} style={styles.winnerRow}>
              <View style={styles.winnerInfo}>
                <Text style={styles.winnerName}>{winner.name || winner.phone_number}</Text>
                <Text style={styles.winnerPrize}>{winner.prize_name}</Text>
              </View>
              <Text style={styles.winnerAmount}>${winner.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      {item.status === 'active' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => handleCompleteDraw(item.id)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Complete & Select Winners</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => handleCancelDraw(item.id)}
          >
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Draw Management</Text>
          <Text style={styles.headerSubtitle}>{draws.length} total draws</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>New Draw</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {['all', 'active', 'completed', 'cancelled'].map((status) => (
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
          data={filteredDraws}
          renderItem={renderDraw}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No draws found</Text>
              <TouchableOpacity 
                style={styles.createFirstBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createFirstBtnText}>Create First Draw</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Draw Modal */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Draw</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Select Draw Type</Text>
              <View style={styles.typeSelector}>
                {[
                  { type: 'weekly', days: 7, icon: 'calendar' },
                  { type: 'monthly', days: 30, icon: 'calendar-outline' },
                  { type: 'quarterly', days: 90, icon: 'calendar-number' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[styles.typeOption, newDrawType === option.type && styles.typeOptionActive]}
                    onPress={() => setNewDrawType(option.type)}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={newDrawType === option.type ? '#fff' : '#64748B'} 
                    />
                    <Text style={[styles.typeText, newDrawType === option.type && styles.typeTextActive]}>
                      {option.type.charAt(0).toUpperCase() + option.type.slice(1)}
                    </Text>
                    <Text style={[styles.typeDays, newDrawType === option.type && styles.typeDaysActive]}>
                      {option.days} days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.prizePreview}>
                <Text style={styles.prizePreviewTitle}>Default Prize Tiers</Text>
                <View style={styles.prizePreviewList}>
                  <Text style={styles.prizePreviewItem}>🥇 Grand Prize: $10,000 (1 winner)</Text>
                  <Text style={styles.prizePreviewItem}>🥈 Second Prize: $5,000 (3 winners)</Text>
                  <Text style={styles.prizePreviewItem}>🥉 Third Prize: $1,000 (10 winners)</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCreateBtn]}
                  onPress={handleCreateDraw}
                >
                  <Ionicons name="add-circle" size={18} color="#fff" />
                  <Text style={styles.modalBtnText}>Create Draw</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Winners Modal */}
      <Modal visible={showWinnersModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.winnersModalContent}>
            <View style={styles.winnersHeader}>
              <Ionicons name="trophy" size={48} color="#F59E0B" />
              <Text style={styles.winnersModalTitle}>Winners Selected!</Text>
              <Text style={styles.winnersModalSubtitle}>Congratulations to all winners</Text>
            </View>
            
            <View style={styles.winnersList}>
              {winners.map((winner, index) => (
                <View key={index} style={styles.winnerModalItem}>
                  <View style={styles.winnerModalInfo}>
                    <Ionicons 
                      name={winner.prize_tier === 1 ? 'medal' : winner.prize_tier === 2 ? 'ribbon' : 'star'} 
                      size={20} 
                      color={winner.prize_tier === 1 ? '#F59E0B' : winner.prize_tier === 2 ? '#94A3B8' : '#CD7F32'} 
                    />
                    <View>
                      <Text style={styles.winnerModalName}>{winner.name || winner.phone_number}</Text>
                      <Text style={styles.winnerModalPrize}>{winner.prize_name}</Text>
                    </View>
                  </View>
                  <Text style={styles.winnerModalAmount}>${winner.amount.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.winnersCloseBtn}
              onPress={() => setShowWinnersModal(false)}
            >
              <Text style={styles.winnersCloseBtnText}>Done</Text>
            </TouchableOpacity>
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
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6', 
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  filterBar: { 
    flexDirection: 'row', 
    paddingHorizontal: 24, 
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1E293B' },
  filterActive: { backgroundColor: '#3B82F6' },
  filterText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 24 },
  
  drawCard: { 
    backgroundColor: '#1E293B', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16 
  },
  drawHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  drawTitleSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  drawTypeName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  drawDates: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  
  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: '#0F172A', 
    borderRadius: 12, 
    padding: 14,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  statDivider: { width: 1, backgroundColor: '#334155' },
  
  tiersSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' },
  tiersList: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12 },
  tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  tierInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierName: { color: '#fff', fontSize: 14 },
  tierAmount: { fontSize: 14, fontWeight: '600', color: '#10B981', marginRight: 16 },
  tierWinners: { fontSize: 12, color: '#64748B', width: 30 },
  
  winnersSection: { marginBottom: 16 },
  winnerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  winnerInfo: {},
  winnerName: { color: '#fff', fontWeight: '500' },
  winnerPrize: { color: '#64748B', fontSize: 12, marginTop: 2 },
  winnerAmount: { color: '#10B981', fontWeight: '600' },
  
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  completeBtn: { backgroundColor: '#10B981' },
  cancelBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  createFirstBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 20,
  },
  createFirstBtnText: { color: '#fff', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 20, width: '100%', maxWidth: 480 },
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
  modalLabel: { fontSize: 13, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' },
  
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeOption: { 
    flex: 1, 
    backgroundColor: '#0F172A', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionActive: { backgroundColor: '#3B82F6', borderColor: '#60A5FA' },
  typeText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  typeTextActive: { color: '#fff' },
  typeDays: { color: '#64748B', fontSize: 11 },
  typeDaysActive: { color: '#BFDBFE' },
  
  prizePreview: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 20 },
  prizePreviewTitle: { fontSize: 13, color: '#94A3B8', marginBottom: 10 },
  prizePreviewList: { gap: 6 },
  prizePreviewItem: { color: '#CBD5E1', fontSize: 13 },
  
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, 
    borderRadius: 10,
    gap: 6,
  },
  modalCancelBtn: { backgroundColor: '#374151' },
  modalCreateBtn: { backgroundColor: '#3B82F6' },
  modalBtnText: { color: '#fff', fontWeight: '600' },
  
  winnersModalContent: { 
    backgroundColor: '#1E293B', 
    borderRadius: 20, 
    width: '100%', 
    maxWidth: 400,
    padding: 24,
  },
  winnersHeader: { alignItems: 'center', marginBottom: 20 },
  winnersModalTitle: { fontSize: 24, fontWeight: 'bold', color: '#F59E0B', marginTop: 12 },
  winnersModalSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  winnersList: { gap: 8 },
  winnerModalItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A', 
    borderRadius: 10, 
    padding: 14,
  },
  winnerModalInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  winnerModalName: { color: '#fff', fontWeight: '600' },
  winnerModalPrize: { color: '#64748B', fontSize: 12, marginTop: 2 },
  winnerModalAmount: { color: '#10B981', fontWeight: 'bold', fontSize: 16 },
  winnersCloseBtn: { 
    backgroundColor: '#3B82F6', 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    marginTop: 20,
  },
  winnersCloseBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
