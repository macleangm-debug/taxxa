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
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';
import { format } from 'date-fns';

const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1200;

interface PrizeTier {
  tier: number;
  name: string;
  prize_type: 'money' | 'item';
  amount?: number;
  item_name?: string;
  image_url?: string;
  winners: number;
}

export default function DrawsManagement() {
  const router = useRouter();
  const { draws, fetchDraws, createDraw, completeDraw, cancelDraw, activeCountry } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPrizeModal, setShowAddPrizeModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const [drawType, setDrawType] = useState('weekly');
  const [drawDate, setDrawDate] = useState('');
  const [drawTime, setDrawTime] = useState('');
  const [prizes, setPrizes] = useState<PrizeTier[]>([
    { tier: 1, name: 'Grand Prize', prize_type: 'money', amount: 10000, winners: 1 },
  ]);
  
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeType, setNewPrizeType] = useState<'money' | 'item'>('money');
  const [newPrizeAmount, setNewPrizeAmount] = useState('');
  const [newPrizeItem, setNewPrizeItem] = useState('');
  const [newPrizeImage, setNewPrizeImage] = useState('');
  const [newPrizeWinners, setNewPrizeWinners] = useState('1');

  const currencySymbol = activeCountry?.currency_symbol || '$';

  const loadDraws = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDraws(statusFilter);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDraws, statusFilter]);

  useEffect(() => { loadDraws(); }, [loadDraws]);

  const resetForm = () => {
    setDrawType('weekly');
    setDrawDate('');
    setDrawTime('');
    setPrizes([{ tier: 1, name: 'Grand Prize', prize_type: 'money', amount: 10000, winners: 1 }]);
  };

  const handleCreate = async () => {
    const days = drawType === 'weekly' ? 7 : drawType === 'monthly' ? 30 : 90;
    const fullDrawDate = drawDate && drawTime ? `${drawDate}T${drawTime}:00` : undefined;
    
    try {
      await createDraw(drawType, days, prizes, fullDrawDate);
      setShowCreateModal(false);
      resetForm();
      Alert.alert('Success', 'Draw created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create draw');
    }
  };

  const addPrize = () => {
    if (!newPrizeName) {
      Alert.alert('Error', 'Enter prize name');
      return;
    }
    
    const newPrize: PrizeTier = {
      tier: prizes.length + 1,
      name: newPrizeName,
      prize_type: newPrizeType,
      amount: newPrizeType === 'money' ? parseInt(newPrizeAmount) || 0 : undefined,
      item_name: newPrizeType === 'item' ? newPrizeItem : undefined,
      image_url: newPrizeType === 'item' ? newPrizeImage : undefined,
      winners: parseInt(newPrizeWinners) || 1,
    };
    
    setPrizes([...prizes, newPrize]);
    setShowAddPrizeModal(false);
    setNewPrizeName('');
    setNewPrizeAmount('');
    setNewPrizeItem('');
    setNewPrizeImage('');
    setNewPrizeWinners('1');
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const handleComplete = (id: string) => {
    Alert.alert('Complete Draw', 'Select winners now?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => completeDraw(id) },
    ]);
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Draw', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => cancelDraw(id) },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#2563EB';
      case 'cancelled': return '#EF4444';
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

  const renderDrawCard = ({ item }: any) => (
    <View style={styles.drawCard}>
      <View style={styles.drawHeader}>
        <View style={styles.drawInfo}>
          <Text style={styles.drawType}>{item.draw_type.charAt(0).toUpperCase() + item.draw_type.slice(1)} Draw</Text>
          <Text style={styles.drawDates}>{format(new Date(item.start_date), 'MMM d')} - {format(new Date(item.end_date), 'MMM d')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      {item.draw_date && (
        <View style={styles.drawDateRow}>
          <Ionicons name="calendar" size={16} color="#F59E0B" />
          <Text style={styles.drawDateText}>{format(new Date(item.draw_date), 'MMM d, yyyy h:mm a')}</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.total_entries}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.prize_tiers?.length || 0}</Text>
          <Text style={styles.statLabel}>Prizes</Text>
        </View>
      </View>

      <View style={styles.prizesList}>
        {item.prize_tiers?.map((tier: any, i: number) => (
          <View key={i} style={styles.prizeRow}>
            <Ionicons name={tier.prize_type === 'item' ? 'gift' : 'cash'} size={18} color={tier.prize_type === 'item' ? '#F59E0B' : '#10B981'} />
            <Text style={styles.prizeName}>{tier.name}</Text>
            <Text style={styles.prizeValue}>
              {tier.prize_type === 'item' ? tier.item_name : `${currencySymbol}${tier.amount?.toLocaleString()}`}
            </Text>
            <Text style={styles.prizeWinners}>x{tier.winners}</Text>
          </View>
        ))}
      </View>

      {item.status === 'active' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleComplete(item.id)}>
            <Text style={styles.actionBtnText}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => handleCancel(item.id)}>
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTableRow = ({ item }: any) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, { flex: 2 }]}>
        <Text style={styles.tableCellTitle}>{item.draw_type.charAt(0).toUpperCase() + item.draw_type.slice(1)} Draw</Text>
        <Text style={styles.tableCellSubtitle}>{format(new Date(item.start_date), 'MMM d')} - {format(new Date(item.end_date), 'MMM d')}</Text>
      </View>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.total_entries}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.prize_tiers?.length || 0}</Text>
      <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
        <View style={[styles.statusBadgeSmall, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusTextSmall, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      {item.status === 'active' && (
        <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }]}>
          <TouchableOpacity onPress={() => handleComplete(item.id)}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCancel(item.id)}>
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Draw</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Entries</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Prizes</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Status</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Actions</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Draws</Text>
          <View style={{ flex: 1 }} />
          <ViewToggle />
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterWrapper}>
        <View style={styles.filters}>
          {['all', 'active', 'completed'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterBtn, (statusFilter === s || (s === 'all' && !statusFilter)) && styles.filterActive]}
              onPress={() => setStatusFilter(s === 'all' ? undefined : s)}
            >
              <Text style={[styles.filterText, (statusFilter === s || (s === 'all' && !statusFilter)) && styles.filterTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.listWrapper}>
          {viewMode === 'table' && <TableHeader />}
          <FlatList
            data={draws}
            renderItem={viewMode === 'cards' ? renderDrawCard : renderTableRow}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>No draws found</Text>}
          />
        </View>
      )}

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Draw</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {['weekly', 'monthly', 'quarterly'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, drawType === t && styles.typeBtnActive]}
                    onPress={() => setDrawType(t)}
                  >
                    <Text style={[styles.typeBtnText, drawType === t && styles.typeBtnTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Draw Date & Time</Text>
              <View style={styles.dateRow}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="YYYY-MM-DD" value={drawDate} onChangeText={setDrawDate} />
                <TextInput style={[styles.input, { width: 80 }]} placeholder="HH:MM" value={drawTime} onChangeText={setDrawTime} />
              </View>

              <View style={styles.prizesHeader}>
                <Text style={styles.label}>Prizes</Text>
                <TouchableOpacity onPress={() => setShowAddPrizeModal(true)}>
                  <Text style={styles.addPrizeLink}>+ Add Prize</Text>
                </TouchableOpacity>
              </View>

              {prizes.map((p, i) => (
                <View key={i} style={styles.prizeItem}>
                  <Ionicons name={p.prize_type === 'item' ? 'gift' : 'cash'} size={20} color={p.prize_type === 'item' ? '#F59E0B' : '#10B981'} />
                  <View style={styles.prizeItemInfo}>
                    <Text style={styles.prizeItemName}>{p.name}</Text>
                    <Text style={styles.prizeItemValue}>
                      {p.prize_type === 'item' ? p.item_name : `${currencySymbol}${p.amount?.toLocaleString()}`} • {p.winners} winner(s)
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removePrize(i)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create Draw</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Prize Modal */}
      <Modal visible={showAddPrizeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Prize</Text>
              <TouchableOpacity onPress={() => setShowAddPrizeModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Prize Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Grand Prize" value={newPrizeName} onChangeText={setNewPrizeName} />

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity style={[styles.typeBtn, newPrizeType === 'money' && styles.typeBtnActive]} onPress={() => setNewPrizeType('money')}>
                  <Ionicons name="cash" size={18} color={newPrizeType === 'money' ? '#fff' : '#10B981'} />
                  <Text style={[styles.typeBtnText, newPrizeType === 'money' && styles.typeBtnTextActive]}>Money</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, newPrizeType === 'item' && styles.typeBtnActive]} onPress={() => setNewPrizeType('item')}>
                  <Ionicons name="gift" size={18} color={newPrizeType === 'item' ? '#fff' : '#F59E0B'} />
                  <Text style={[styles.typeBtnText, newPrizeType === 'item' && styles.typeBtnTextActive]}>Item</Text>
                </TouchableOpacity>
              </View>

              {newPrizeType === 'money' ? (
                <>
                  <Text style={styles.label}>Amount ({currencySymbol})</Text>
                  <TextInput style={styles.input} placeholder="10000" keyboardType="numeric" value={newPrizeAmount} onChangeText={setNewPrizeAmount} />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Item Name</Text>
                  <TextInput style={styles.input} placeholder="e.g. Toyota Corolla" value={newPrizeItem} onChangeText={setNewPrizeItem} />
                  <Text style={styles.label}>Image URL (optional)</Text>
                  <TextInput style={styles.input} placeholder="https://..." value={newPrizeImage} onChangeText={setNewPrizeImage} />
                </>
              )}

              <Text style={styles.label}>Number of Winners</Text>
              <TextInput style={styles.input} placeholder="1" keyboardType="numeric" value={newPrizeWinners} onChangeText={setNewPrizeWinners} />

              <TouchableOpacity style={styles.createBtn} onPress={addPrize}>
                <Text style={styles.createBtnText}>Add Prize</Text>
              </TouchableOpacity>
            </ScrollView>
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
    gap: 12,
  },
  backBtn: { marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 2 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 4 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  
  filterWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filters: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    gap: 8,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' },
  filterActive: { backgroundColor: '#2563EB' },
  filterText: { color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  
  listWrapper: { flex: 1, alignItems: isWeb ? 'center' : undefined },
  list: { padding: 20, width: '100%', maxWidth: MAX_WIDTH },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  
  drawCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  drawHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  drawInfo: {},
  drawType: { fontSize: 16, fontWeight: '600', color: '#111827' },
  drawDates: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  
  drawDateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginBottom: 12, gap: 8 },
  drawDateText: { color: '#92400E', fontSize: 13, fontWeight: '500' },
  
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: '#F9FAFB', borderRadius: 8, marginRight: 8 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  
  prizesList: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  prizeName: { flex: 1, fontSize: 14, color: '#111827' },
  prizeValue: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  prizeWinners: { fontSize: 12, color: '#6B7280', width: 30 },
  
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  completeBtn: { backgroundColor: '#10B981' },
  cancelBtn: { backgroundColor: '#FEE2E2' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  
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
  tableCellTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
  tableCellSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusTextSmall: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { padding: 20 },
  
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#F3F4F6', gap: 6 },
  typeBtnActive: { backgroundColor: '#2563EB' },
  typeBtnText: { color: '#6B7280', fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
  
  dateRow: { flexDirection: 'row', gap: 10 },
  
  prizesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  addPrizeLink: { color: '#2563EB', fontWeight: '600' },
  
  prizeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 8, gap: 10 },
  prizeItemInfo: { flex: 1 },
  prizeItemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  prizeItemValue: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  
  createBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
