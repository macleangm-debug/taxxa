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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';
import { format, formatDistanceToNow } from 'date-fns';

export default function DrawsManagement() {
  const router = useRouter();
  const { draws, fetchDraws, createDraw, completeDraw, cancelDraw } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<any>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const [newDrawType, setNewDrawType] = useState('weekly');

  const loadDraws = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDraws();
    } catch (error) {
      console.error('Error loading draws:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDraws]);

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
      'This will select winners randomly. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
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
      'Are you sure you want to cancel this draw?',
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

  const renderDraw = ({ item }: { item: any }) => (
    <View style={styles.drawCard}>
      <View style={styles.drawHeader}>
        <View style={styles.drawType}>
          <Ionicons name="trophy" size={24} color="#F59E0B" />
          <Text style={styles.drawTypeName}>
            {item.draw_type.charAt(0).toUpperCase() + item.draw_type.slice(1)} Draw
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.drawInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#64748B" />
          <Text style={styles.infoText}>
            {format(new Date(item.start_date), 'MMM d')} - {format(new Date(item.end_date), 'MMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people" size={16} color="#64748B" />
          <Text style={styles.infoText}>{item.participants} participants</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="ticket" size={16} color="#64748B" />
          <Text style={styles.infoText}>{item.total_entries} entries</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash" size={16} color="#64748B" />
          <Text style={styles.infoText}>${getTotalPrize(item.prize_tiers).toLocaleString()} prize pool</Text>
        </View>
      </View>

      {/* Prize Tiers */}
      <View style={styles.tiersContainer}>
        <Text style={styles.tiersTitle}>Prize Tiers</Text>
        {item.prize_tiers.map((tier: any, index: number) => (
          <View key={index} style={styles.tierRow}>
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierAmount}>${tier.amount.toLocaleString()} x{tier.winners}</Text>
          </View>
        ))}
      </View>

      {/* Winners if completed */}
      {item.status === 'completed' && item.winners.length > 0 && (
        <View style={styles.winnersSection}>
          <Text style={styles.winnersTitle}>Winners</Text>
          {item.winners.map((winner: any, index: number) => (
            <View key={index} style={styles.winnerRow}>
              <Text style={styles.winnerName}>{winner.name || winner.phone_number}</Text>
              <Text style={styles.winnerPrize}>${winner.amount} - {winner.prize_name}</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Draw Management</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={draws}
          renderItem={renderDraw}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No draws found</Text>
            </View>
          }
        />
      )}

      {/* Create Draw Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Draw</Text>
            
            <Text style={styles.modalLabel}>Draw Type</Text>
            <View style={styles.typeSelector}>
              {['weekly', 'monthly', 'quarterly'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, newDrawType === type && styles.typeOptionActive]}
                  onPress={() => setNewDrawType(type)}
                >
                  <Text style={[styles.typeText, newDrawType === type && styles.typeTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
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
                <Text style={styles.modalBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Winners Modal */}
      <Modal visible={showWinnersModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.winnersModalContent}>
            <Ionicons name="trophy" size={48} color="#F59E0B" />
            <Text style={styles.winnersModalTitle}>Winners Selected!</Text>
            
            {winners.map((winner, index) => (
              <View key={index} style={styles.winnerModalItem}>
                <Text style={styles.winnerModalName}>{winner.name || winner.phone_number}</Text>
                <Text style={styles.winnerModalPrize}>{winner.prize_name} - ${winner.amount}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.winnersCloseBtn}
              onPress={() => setShowWinnersModal(false)}
            >
              <Text style={styles.winnersCloseBtnText}>Close</Text>
            </TouchableOpacity>
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton: { backgroundColor: '#3B82F6', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  drawCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16 },
  drawHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  drawType: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawTypeName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  drawInfo: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: '#94A3B8', fontSize: 14 },
  tiersContainer: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  tiersTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  tierName: { color: '#fff', fontSize: 14 },
  tierAmount: { color: '#10B981', fontSize: 14, fontWeight: '600' },
  winnersSection: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, marginTop: 12 },
  winnersTitle: { fontSize: 14, fontWeight: '600', color: '#F59E0B', marginBottom: 8 },
  winnerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  winnerName: { color: '#fff', fontSize: 14 },
  winnerPrize: { color: '#10B981', fontSize: 14 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8 },
  completeBtn: { backgroundColor: '#10B981' },
  cancelBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 24, textAlign: 'center' },
  modalLabel: { fontSize: 14, color: '#94A3B8', marginBottom: 8 },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  typeOption: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#0F172A', alignItems: 'center' },
  typeOptionActive: { backgroundColor: '#3B82F6' },
  typeText: { color: '#94A3B8', fontWeight: '500' },
  typeTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: '#374151' },
  modalCreateBtn: { backgroundColor: '#3B82F6' },
  modalBtnText: { color: '#fff', fontWeight: '600' },
  winnersModalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center' },
  winnersModalTitle: { fontSize: 24, fontWeight: 'bold', color: '#F59E0B', marginVertical: 16 },
  winnerModalItem: { width: '100%', backgroundColor: '#0F172A', borderRadius: 8, padding: 12, marginVertical: 4 },
  winnerModalName: { color: '#fff', fontWeight: '600' },
  winnerModalPrize: { color: '#10B981', marginTop: 4 },
  winnersCloseBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, marginTop: 16 },
  winnersCloseBtnText: { color: '#fff', fontWeight: '600' },
});
