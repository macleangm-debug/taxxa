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
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';
import { format, formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

interface PrizeTier {
  tier: number;
  name: string;
  prize_type: 'money' | 'item';
  amount?: number;
  item_name?: string;
  item_description?: string;
  image_url?: string;
  winners: number;
}

export default function DrawsManagement() {
  const router = useRouter();
  const { draws, fetchDraws, createDraw, completeDraw, cancelDraw, activeCountry } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // Create draw form state
  const [newDrawType, setNewDrawType] = useState('weekly');
  const [drawDate, setDrawDate] = useState('');
  const [drawTime, setDrawTime] = useState('');
  const [prizeTiers, setPrizeTiers] = useState<PrizeTier[]>([
    { tier: 1, name: 'Grand Prize', prize_type: 'money', amount: 10000, winners: 1 },
    { tier: 2, name: 'Second Prize', prize_type: 'money', amount: 5000, winners: 3 },
    { tier: 3, name: 'Third Prize', prize_type: 'money', amount: 1000, winners: 10 },
  ]);
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [currentTier, setCurrentTier] = useState<PrizeTier>({
    tier: 1,
    name: '',
    prize_type: 'money',
    amount: 0,
    winners: 1,
  });

  const currencySymbol = activeCountry?.currency_symbol || '$';

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
    
    // Build draw date from inputs
    let fullDrawDate;
    if (drawDate && drawTime) {
      fullDrawDate = `${drawDate}T${drawTime}:00`;
    }
    
    try {
      await createDraw(newDrawType, days, prizeTiers, fullDrawDate);
      setShowCreateModal(false);
      // Reset form
      setPrizeTiers([
        { tier: 1, name: 'Grand Prize', prize_type: 'money', amount: 10000, winners: 1 },
        { tier: 2, name: 'Second Prize', prize_type: 'money', amount: 5000, winners: 3 },
        { tier: 3, name: 'Third Prize', prize_type: 'money', amount: 1000, winners: 10 },
      ]);
      setDrawDate('');
      setDrawTime('');
      Alert.alert('Success', 'Draw created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create draw');
    }
  };

  const handleCompleteDraw = async (drawId: string) => {
    Alert.alert(
      'Complete Draw',
      'This will randomly select winners. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Winners',
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
      'Are you sure? All entries will be lost.',
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

  const openTierEditor = (index: number | null) => {
    if (index !== null) {
      setCurrentTier({ ...prizeTiers[index] });
      setEditingTierIndex(index);
    } else {
      setCurrentTier({
        tier: prizeTiers.length + 1,
        name: '',
        prize_type: 'money',
        amount: 0,
        winners: 1,
      });
      setEditingTierIndex(null);
    }
    setShowTierModal(true);
  };

  const saveTier = () => {
    if (!currentTier.name) {
      Alert.alert('Error', 'Please enter a prize name');
      return;
    }
    
    if (editingTierIndex !== null) {
      const updated = [...prizeTiers];
      updated[editingTierIndex] = currentTier;
      setPrizeTiers(updated);
    } else {
      setPrizeTiers([...prizeTiers, currentTier]);
    }
    setShowTierModal(false);
  };

  const removeTier = (index: number) => {
    const updated = prizeTiers.filter((_, i) => i !== index);
    // Update tier numbers
    updated.forEach((tier, i) => tier.tier = i + 1);
    setPrizeTiers(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getPrizeDisplay = (tier: any) => {
    if (tier.prize_type === 'item') {
      return tier.item_name || tier.name;
    }
    return `${currencySymbol}${(tier.amount || 0).toLocaleString()}`;
  };

  const getTotalPrize = (tiers: any[]) => {
    return tiers
      .filter(t => t.prize_type === 'money')
      .reduce((sum, tier) => sum + ((tier.amount || 0) * tier.winners), 0);
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

      {/* Draw Date/Time */}
      {item.draw_date && (
        <View style={styles.drawDateBanner}>
          <Ionicons name="calendar" size={18} color="#F59E0B" />
          <Text style={styles.drawDateText}>
            Draw: {format(new Date(item.draw_date), 'EEEE, MMM d, yyyy')} at {format(new Date(item.draw_date), 'h:mm a')}
          </Text>
        </View>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={18} color="#64748B" />
          <Text style={styles.statValue}>{item.participants || 0}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="ticket" size={18} color="#64748B" />
          <Text style={styles.statValue}>{item.total_entries}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="cash" size={18} color="#64748B" />
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {currencySymbol}{getTotalPrize(item.prize_tiers).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Cash Prizes</Text>
        </View>
      </View>

      {/* Prize Tiers */}
      <View style={styles.tiersSection}>
        <Text style={styles.sectionLabel}>Prizes</Text>
        <View style={styles.tiersList}>
          {item.prize_tiers.map((tier: any, index: number) => (
            <View key={index} style={styles.tierRow}>
              {tier.image_url ? (
                <Image source={{ uri: tier.image_url }} style={styles.tierImage} />
              ) : (
                <View style={[styles.tierIconContainer, { backgroundColor: tier.tier === 1 ? '#F59E0B20' : tier.tier === 2 ? '#94A3B820' : '#CD7F3220' }]}>
                  <Ionicons 
                    name={tier.prize_type === 'item' ? 'gift' : tier.tier === 1 ? 'medal' : tier.tier === 2 ? 'ribbon' : 'star'} 
                    size={20} 
                    color={tier.tier === 1 ? '#F59E0B' : tier.tier === 2 ? '#94A3B8' : '#CD7F32'} 
                  />
                </View>
              )}
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>{tier.name}</Text>
                {tier.prize_type === 'item' && tier.item_name && (
                  <Text style={styles.tierItemName}>{tier.item_name}</Text>
                )}
              </View>
              <View style={styles.tierValueContainer}>
                <Text style={[styles.tierAmount, { color: tier.prize_type === 'item' ? '#F59E0B' : '#10B981' }]}>
                  {getPrizeDisplay(tier)}
                </Text>
                <Text style={styles.tierWinners}>x{tier.winners} winner{tier.winners > 1 ? 's' : ''}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      {item.status === 'active' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => handleCompleteDraw(item.id)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Complete Draw</Text>
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
          <Text style={styles.addButtonText}>New</Text>
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
            
            <ScrollView style={styles.modalBody}>
              {/* Draw Type */}
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

              {/* Draw Date & Time */}
              <Text style={styles.modalLabel}>Draw Date & Time</Text>
              <View style={styles.dateTimeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748B"
                  value={drawDate}
                  onChangeText={setDrawDate}
                />
                <TextInput
                  style={[styles.input, { width: 100 }]}
                  placeholder="HH:MM"
                  placeholderTextColor="#64748B"
                  value={drawTime}
                  onChangeText={setDrawTime}
                />
              </View>

              {/* Prize Tiers */}
              <View style={styles.prizeTiersHeader}>
                <Text style={styles.modalLabel}>Prize Tiers</Text>
                <TouchableOpacity style={styles.addTierBtn} onPress={() => openTierEditor(null)}>
                  <Ionicons name="add" size={18} color="#3B82F6" />
                  <Text style={styles.addTierBtnText}>Add Prize</Text>
                </TouchableOpacity>
              </View>
              
              {prizeTiers.map((tier, index) => (
                <View key={index} style={styles.tierPreview}>
                  <View style={styles.tierPreviewLeft}>
                    <Ionicons 
                      name={tier.prize_type === 'item' ? 'gift' : 'cash'} 
                      size={20} 
                      color={tier.prize_type === 'item' ? '#F59E0B' : '#10B981'} 
                    />
                    <View>
                      <Text style={styles.tierPreviewName}>{tier.name}</Text>
                      <Text style={styles.tierPreviewValue}>
                        {tier.prize_type === 'item' 
                          ? tier.item_name || 'Item Prize'
                          : `${currencySymbol}${tier.amount?.toLocaleString()}`
                        } • {tier.winners} winner{tier.winners > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tierPreviewActions}>
                    <TouchableOpacity onPress={() => openTierEditor(index)}>
                      <Ionicons name="pencil" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeTier(index)}>
                      <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

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
                  <Text style={styles.modalBtnText}>Create Draw</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Prize Tier Editor Modal */}
      <Modal visible={showTierModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.tierModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTierIndex !== null ? 'Edit Prize' : 'Add Prize'}
              </Text>
              <TouchableOpacity onPress={() => setShowTierModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Prize Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Grand Prize, First Prize"
                placeholderTextColor="#64748B"
                value={currentTier.name}
                onChangeText={(text) => setCurrentTier({ ...currentTier, name: text })}
              />

              <Text style={styles.modalLabel}>Prize Type</Text>
              <View style={styles.prizeTypeSelector}>
                <TouchableOpacity
                  style={[styles.prizeTypeOption, currentTier.prize_type === 'money' && styles.prizeTypeActive]}
                  onPress={() => setCurrentTier({ ...currentTier, prize_type: 'money' })}
                >
                  <Ionicons name="cash" size={24} color={currentTier.prize_type === 'money' ? '#fff' : '#10B981'} />
                  <Text style={[styles.prizeTypeText, currentTier.prize_type === 'money' && styles.prizeTypeTextActive]}>Money</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.prizeTypeOption, currentTier.prize_type === 'item' && styles.prizeTypeActive]}
                  onPress={() => setCurrentTier({ ...currentTier, prize_type: 'item' })}
                >
                  <Ionicons name="gift" size={24} color={currentTier.prize_type === 'item' ? '#fff' : '#F59E0B'} />
                  <Text style={[styles.prizeTypeText, currentTier.prize_type === 'item' && styles.prizeTypeTextActive]}>Item</Text>
                </TouchableOpacity>
              </View>

              {currentTier.prize_type === 'money' ? (
                <>
                  <Text style={styles.modalLabel}>Amount ({currencySymbol})</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10000"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={currentTier.amount?.toString() || ''}
                    onChangeText={(text) => setCurrentTier({ ...currentTier, amount: parseInt(text) || 0 })}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.modalLabel}>Item Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Toyota Corolla, iPhone 15"
                    placeholderTextColor="#64748B"
                    value={currentTier.item_name || ''}
                    onChangeText={(text) => setCurrentTier({ ...currentTier, item_name: text })}
                  />
                  <Text style={styles.modalLabel}>Description (optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Prize description..."
                    placeholderTextColor="#64748B"
                    multiline
                    value={currentTier.item_description || ''}
                    onChangeText={(text) => setCurrentTier({ ...currentTier, item_description: text })}
                  />
                  <Text style={styles.modalLabel}>Image URL (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor="#64748B"
                    value={currentTier.image_url || ''}
                    onChangeText={(text) => setCurrentTier({ ...currentTier, image_url: text })}
                  />
                </>
              )}

              <Text style={styles.modalLabel}>Number of Winners</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={currentTier.winners?.toString() || '1'}
                onChangeText={(text) => setCurrentTier({ ...currentTier, winners: parseInt(text) || 1 })}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => setShowTierModal(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCreateBtn]}
                  onPress={saveTier}
                >
                  <Text style={styles.modalBtnText}>Save Prize</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
            </View>
            
            <ScrollView style={styles.winnersList}>
              {winners.map((winner, index) => (
                <View key={index} style={styles.winnerModalItem}>
                  <Ionicons 
                    name={winner.prize_tier === 1 ? 'medal' : 'star'} 
                    size={20} 
                    color="#F59E0B" 
                  />
                  <View style={styles.winnerModalInfo}>
                    <Text style={styles.winnerModalName}>{winner.name || winner.phone_number}</Text>
                    <Text style={styles.winnerModalPrize}>{winner.prize_name}</Text>
                  </View>
                  <Text style={styles.winnerModalAmount}>
                    {winner.prize_type === 'item' ? winner.item_name : `${currencySymbol}${winner.amount?.toLocaleString()}`}
                  </Text>
                </View>
              ))}
            </ScrollView>

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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  filterBar: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  filterButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1E293B' },
  filterActive: { backgroundColor: '#3B82F6' },
  filterText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 24 },
  
  drawCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16 },
  drawHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  drawTitleSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  drawTypeName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  drawDates: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  
  drawDateBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', borderRadius: 10, padding: 12, marginBottom: 12, gap: 10 },
  drawDateText: { color: '#F59E0B', fontWeight: '500', fontSize: 14 },
  
  statsRow: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  statDivider: { width: 1, backgroundColor: '#334155' },
  
  tiersSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' },
  tiersList: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12 },
  tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  tierImage: { width: 44, height: 44, borderRadius: 8, marginRight: 12 },
  tierIconContainer: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tierInfo: { flex: 1 },
  tierName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  tierItemName: { color: '#F59E0B', fontSize: 12, marginTop: 2 },
  tierValueContainer: { alignItems: 'flex-end' },
  tierAmount: { fontSize: 14, fontWeight: '600' },
  tierWinners: { fontSize: 11, color: '#64748B', marginTop: 2 },
  
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  completeBtn: { backgroundColor: '#10B981' },
  cancelBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90%' },
  tierModalContent: { backgroundColor: '#1E293B', borderRadius: 20, width: '100%', maxWidth: 400, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalBody: { padding: 20 },
  modalLabel: { fontSize: 13, color: '#94A3B8', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  
  input: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15 },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  
  typeSelector: { flexDirection: 'row', gap: 10 },
  typeOption: { flex: 1, backgroundColor: '#0F172A', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  typeOptionActive: { backgroundColor: '#3B82F6', borderColor: '#60A5FA' },
  typeText: { color: '#94A3B8', fontWeight: '600', fontSize: 13 },
  typeTextActive: { color: '#fff' },
  
  prizeTiersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  addTierBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addTierBtnText: { color: '#3B82F6', fontWeight: '600', fontSize: 13 },
  
  tierPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, padding: 14, marginTop: 10 },
  tierPreviewLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierPreviewName: { color: '#fff', fontWeight: '600' },
  tierPreviewValue: { color: '#64748B', fontSize: 12, marginTop: 2 },
  tierPreviewActions: { flexDirection: 'row', gap: 16 },
  
  prizeTypeSelector: { flexDirection: 'row', gap: 12 },
  prizeTypeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', borderRadius: 10, padding: 16, gap: 8, borderWidth: 2, borderColor: 'transparent' },
  prizeTypeActive: { backgroundColor: '#3B82F6', borderColor: '#60A5FA' },
  prizeTypeText: { color: '#94A3B8', fontWeight: '600' },
  prizeTypeTextActive: { color: '#fff' },
  
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
  modalCancelBtn: { backgroundColor: '#374151' },
  modalCreateBtn: { backgroundColor: '#3B82F6' },
  modalBtnText: { color: '#fff', fontWeight: '600' },
  
  winnersModalContent: { backgroundColor: '#1E293B', borderRadius: 20, width: '100%', maxWidth: 400, padding: 24 },
  winnersHeader: { alignItems: 'center', marginBottom: 20 },
  winnersModalTitle: { fontSize: 24, fontWeight: 'bold', color: '#F59E0B', marginTop: 12 },
  winnersList: { maxHeight: 300 },
  winnerModalItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, padding: 14, marginBottom: 8, gap: 12 },
  winnerModalInfo: { flex: 1 },
  winnerModalName: { color: '#fff', fontWeight: '600' },
  winnerModalPrize: { color: '#64748B', fontSize: 12, marginTop: 2 },
  winnerModalAmount: { color: '#10B981', fontWeight: 'bold' },
  winnersCloseBtn: { backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  winnersCloseBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
