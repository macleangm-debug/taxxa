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
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';
import { format, addDays, addMonths } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const isWeb = Platform.OS === 'web';

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
  const { draws, fetchDraws, createDraw, completeDraw, cancelDraw, activeCountry } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPrizeModal, setShowAddPrizeModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  const [drawType, setDrawType] = useState('weekly');
  const [drawDate, setDrawDate] = useState(new Date());
  const [drawTime, setDrawTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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

  // Calculate draw period based on type and selected date
  const getDrawPeriod = () => {
    const startDate = new Date();
    let endDate: Date;
    
    switch (drawType) {
      case 'weekly':
        endDate = addDays(drawDate, 0); // End date is the draw date
        break;
      case 'monthly':
        endDate = addDays(drawDate, 0);
        break;
      case 'quarterly':
        endDate = addDays(drawDate, 0);
        break;
      default:
        endDate = drawDate;
    }
    
    return {
      start: format(startDate, 'MMM d, yyyy'),
      end: format(endDate, 'MMM d, yyyy'),
      days: Math.ceil((drawDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

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
    setDrawDate(new Date());
    setDrawTime(new Date());
    setPrizes([{ tier: 1, name: 'Grand Prize', prize_type: 'money', amount: 10000, winners: 1 }]);
  };

  const handleCreate = async () => {
    const period = getDrawPeriod();
    
    // Combine date and time
    const combinedDateTime = new Date(drawDate);
    combinedDateTime.setHours(drawTime.getHours(), drawTime.getMinutes(), 0, 0);
    
    const fullDrawDate = combinedDateTime.toISOString();
    
    try {
      await createDraw(drawType, period.days > 0 ? period.days : 7, prizes, fullDrawDate);
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDrawDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setDrawTime(selectedTime);
    }
  };

  // Web-specific date/time inputs
  const WebDateTimePicker = () => (
    <View style={styles.dateTimeRow}>
      <View style={styles.datePickerContainer}>
        <Text style={styles.pickerLabel}>Draw Date</Text>
        <input
          type="date"
          value={format(drawDate, 'yyyy-MM-dd')}
          onChange={(e) => setDrawDate(new Date(e.target.value))}
          min={format(new Date(), 'yyyy-MM-dd')}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            color: '#1E293B',
            outline: 'none',
          }}
        />
      </View>
      <View style={styles.timePickerContainer}>
        <Text style={styles.pickerLabel}>Time</Text>
        <input
          type="time"
          value={format(drawTime, 'HH:mm')}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(':');
            const newTime = new Date();
            newTime.setHours(parseInt(hours), parseInt(minutes));
            setDrawTime(newTime);
          }}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            color: '#1E293B',
            outline: 'none',
          }}
        />
      </View>
    </View>
  );

  // Native date/time picker
  const NativeDateTimePicker = () => (
    <View style={styles.dateTimeRow}>
      <View style={styles.datePickerContainer}>
        <Text style={styles.pickerLabel}>Draw Date</Text>
        <TouchableOpacity 
          style={styles.pickerButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color="#2563EB" />
          <Text style={styles.pickerButtonText}>
            {format(drawDate, 'MMM d, yyyy')}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={drawDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>
      <View style={styles.timePickerContainer}>
        <Text style={styles.pickerLabel}>Time</Text>
        <TouchableOpacity 
          style={styles.pickerButton} 
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time" size={20} color="#2563EB" />
          <Text style={styles.pickerButtonText}>
            {format(drawTime, 'h:mm a')}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={drawTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}
      </View>
    </View>
  );

  const renderTableRow = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
      <View style={styles.drawCell}>
        <View style={[styles.drawIcon, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Ionicons name="trophy" size={18} color={getStatusColor(item.status)} />
        </View>
        <View>
          <Text style={styles.drawType}>{item.draw_type?.charAt(0).toUpperCase() + item.draw_type?.slice(1)} Draw</Text>
          <Text style={styles.drawDates}>
            {format(new Date(item.start_date), 'MMM d')} - {format(new Date(item.end_date), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>
      <Text style={styles.tableCell}>{item.total_entries}</Text>
      <Text style={styles.tableCell}>{item.prize_tiers?.length || 0}</Text>
      <View style={styles.tableCell}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.actionCell}>
        {item.status === 'active' ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleComplete(item.id)}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleCancel(item.id)}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.completedText}>-</Text>
        )}
      </View>
    </View>
  );

  const content = (
    <View style={styles.content}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.filterTabs}>
          {['all', 'active', 'completed', 'cancelled'].map((status) => (
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
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Draw</Text>
          <Text style={styles.tableHeaderCell}>Entries</Text>
          <Text style={styles.tableHeaderCell}>Prizes</Text>
          <Text style={styles.tableHeaderCell}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Actions</Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={draws}
            renderItem={renderTableRow}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No draws found</Text>
                <Text style={styles.emptyText}>Create a new draw to get started</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );

  const period = getDrawPeriod();

  return (
    <AdminLayout>
      <AdminHeader 
        title="Draws" 
        subtitle={`${draws.length} total draws`}
        rightContent={
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>New Draw</Text>
          </TouchableOpacity>
        }
      />
      {content}

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Draw</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
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
              {isWeb ? <WebDateTimePicker /> : <NativeDateTimePicker />}

              {/* Draw Period Preview */}
              <View style={styles.periodPreview}>
                <View style={styles.periodIcon}>
                  <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                </View>
                <View style={styles.periodInfo}>
                  <Text style={styles.periodLabel}>Draw Period</Text>
                  <Text style={styles.periodDates}>
                    {period.start} → {period.end}
                  </Text>
                  <Text style={styles.periodDays}>
                    {period.days > 0 ? `${period.days} days from now` : 'Today'}
                  </Text>
                </View>
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

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitBtnText}>Create Draw</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Prize Modal */}
      <Modal visible={showAddPrizeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Prize</Text>
              <TouchableOpacity onPress={() => setShowAddPrizeModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Prize Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Grand Prize" value={newPrizeName} onChangeText={setNewPrizeName} placeholderTextColor="#9CA3AF" />

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
                  <TextInput style={styles.input} placeholder="10000" keyboardType="numeric" value={newPrizeAmount} onChangeText={setNewPrizeAmount} placeholderTextColor="#9CA3AF" />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Item Name</Text>
                  <TextInput style={styles.input} placeholder="e.g. Toyota Corolla" value={newPrizeItem} onChangeText={setNewPrizeItem} placeholderTextColor="#9CA3AF" />
                  <Text style={styles.label}>Image URL (optional)</Text>
                  <TextInput style={styles.input} placeholder="https://..." value={newPrizeImage} onChangeText={setNewPrizeImage} placeholderTextColor="#9CA3AF" />
                </>
              )}

              <Text style={styles.label}>Number of Winners</Text>
              <TextInput style={styles.input} placeholder="1" keyboardType="numeric" value={newPrizeWinners} onChangeText={setNewPrizeWinners} placeholderTextColor="#9CA3AF" />

              <TouchableOpacity style={styles.submitBtn} onPress={addPrize}>
                <Text style={styles.submitBtnText}>Add Prize</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 10,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  drawCell: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  drawDates: {
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
    flex: 0.8,
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 4,
  },
  completedText: {
    color: '#94A3B8',
    fontSize: 14,
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
    maxWidth: 520,
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
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  typeBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeBtnText: {
    color: '#64748B',
    fontWeight: '500',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerContainer: {
    flex: 2,
  },
  timePickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  periodPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  periodIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodInfo: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodDates: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginTop: 4,
  },
  periodDays: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 2,
  },
  prizesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addPrizeLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  prizeItemInfo: {
    flex: 1,
  },
  prizeItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  prizeItemValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
