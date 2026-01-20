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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

interface Draw {
  id: string;
  draw_type: string;
  start_date: string;
  end_date: string;
  draw_date?: string;
  status: string;
  prize_tiers: PrizeTier[];
  total_entries: number;
}

export default function DrawsManagement() {
  const { draws, fetchDraws, createDraw, updateDraw, deleteDraw, completeDraw, activeCountry, fetchDrawAudit, exportDrawAudit } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showDeletePrizeConfirm, setShowDeletePrizeConfirm] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  
  // Audit data
  const [auditData, setAuditData] = useState<any>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // For create/edit draw
  const [editingDraw, setEditingDraw] = useState<Draw | null>(null);
  const [drawType, setDrawType] = useState('weekly');
  const [drawDate, setDrawDate] = useState(new Date());
  const [drawTime, setDrawTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [prizes, setPrizes] = useState<PrizeTier[]>([
    { tier: 1, name: 'Grand Prize', prize_type: 'money', amount: 10000, winners: 1 },
  ]);
  
  // For add/edit prize modal
  const [editingPrizeIndex, setEditingPrizeIndex] = useState<number | null>(null);
  const [prizeName, setPrizeName] = useState('');
  const [prizeType, setPrizeType] = useState<'money' | 'item'>('money');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [prizeItem, setPrizeItem] = useState('');
  const [prizeImage, setPrizeImage] = useState('');
  const [prizeWinners, setPrizeWinners] = useState('1');
  
  // For delete prize
  const [prizeToDeleteIndex, setPrizeToDeleteIndex] = useState<number | null>(null);
  
  // For delete/complete draw
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);

  const currencySymbol = activeCountry?.currency_symbol || '$';

  const getDrawPeriod = () => {
    const startDate = new Date();
    return {
      start: format(startDate, 'MMM d, yyyy'),
      end: format(drawDate, 'MMM d, yyyy'),
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
    setEditingDraw(null);
  };

  const resetPrizeForm = () => {
    setEditingPrizeIndex(null);
    setPrizeName('');
    setPrizeType('money');
    setPrizeAmount('');
    setPrizeItem('');
    setPrizeImage('');
    setPrizeWinners('1');
  };

  // Open Create Modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const openEditModal = (draw: Draw) => {
    setEditingDraw(draw);
    setDrawType(draw.draw_type);
    
    if (draw.draw_date) {
      const existingDate = new Date(draw.draw_date);
      setDrawDate(existingDate);
      setDrawTime(existingDate);
    } else {
      setDrawDate(new Date(draw.end_date));
      setDrawTime(new Date());
    }
    
    if (draw.prize_tiers && draw.prize_tiers.length > 0) {
      setPrizes(draw.prize_tiers);
    } else {
      setPrizes([{ tier: 1, name: 'Grand Prize', prize_type: 'money', amount: 10000, winners: 1 }]);
    }
    
    setShowEditModal(true);
  };

  // Open Add Prize Modal
  const openAddPrizeModal = () => {
    resetPrizeForm();
    setShowPrizeModal(true);
  };

  // Open Edit Prize Modal
  const openEditPrizeModal = (index: number) => {
    const prize = prizes[index];
    setEditingPrizeIndex(index);
    setPrizeName(prize.name);
    setPrizeType(prize.prize_type);
    setPrizeAmount(prize.amount?.toString() || '');
    setPrizeItem(prize.item_name || '');
    setPrizeImage(prize.image_url || '');
    setPrizeWinners(prize.winners.toString());
    setShowPrizeModal(true);
  };

  // Save Prize (Add or Edit)
  const savePrize = () => {
    if (!prizeName) {
      Alert.alert('Error', 'Enter prize name');
      return;
    }
    
    const prizeData: PrizeTier = {
      tier: editingPrizeIndex !== null ? prizes[editingPrizeIndex].tier : prizes.length + 1,
      name: prizeName,
      prize_type: prizeType,
      amount: prizeType === 'money' ? parseInt(prizeAmount) || 0 : undefined,
      item_name: prizeType === 'item' ? prizeItem : undefined,
      image_url: prizeType === 'item' ? prizeImage : undefined,
      winners: parseInt(prizeWinners) || 1,
    };
    
    if (editingPrizeIndex !== null) {
      // Update existing prize
      const updatedPrizes = [...prizes];
      updatedPrizes[editingPrizeIndex] = prizeData;
      setPrizes(updatedPrizes);
    } else {
      // Add new prize
      setPrizes([...prizes, prizeData]);
    }
    
    setShowPrizeModal(false);
    resetPrizeForm();
  };

  // Show Delete Prize Confirmation
  const confirmDeletePrize = (index: number) => {
    setPrizeToDeleteIndex(index);
    setShowDeletePrizeConfirm(true);
  };

  // Execute Delete Prize
  const executeDeletePrize = () => {
    if (prizeToDeleteIndex === null) return;
    setPrizes(prizes.filter((_, i) => i !== prizeToDeleteIndex));
    setShowDeletePrizeConfirm(false);
    setPrizeToDeleteIndex(null);
  };

  // Show Create Confirmation
  const confirmCreate = () => {
    setShowCreateConfirm(true);
  };

  // Execute Create
  const executeCreate = async () => {
    setIsSubmitting(true);
    const period = getDrawPeriod();
    const combinedDateTime = new Date(drawDate);
    combinedDateTime.setHours(drawTime.getHours(), drawTime.getMinutes(), 0, 0);
    const fullDrawDate = combinedDateTime.toISOString();
    
    try {
      await createDraw(drawType, period.days > 0 ? period.days : 7, prizes, fullDrawDate);
      setShowCreateConfirm(false);
      setShowCreateModal(false);
      resetForm();
      Alert.alert('Success', 'Draw created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create draw');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show Update Confirmation
  const confirmUpdate = () => {
    setShowUpdateConfirm(true);
  };

  // Execute Update
  const executeUpdate = async () => {
    if (!editingDraw) return;
    setIsSubmitting(true);
    
    const combinedDateTime = new Date(drawDate);
    combinedDateTime.setHours(drawTime.getHours(), drawTime.getMinutes(), 0, 0);
    const fullDrawDate = combinedDateTime.toISOString();
    
    try {
      await updateDraw(editingDraw.id, drawType, fullDrawDate, prizes);
      setShowUpdateConfirm(false);
      setShowEditModal(false);
      resetForm();
      Alert.alert('Success', 'Draw updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update draw');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show Delete Draw Confirmation
  const confirmDelete = (draw: Draw) => {
    setSelectedDraw(draw);
    setShowDeleteConfirm(true);
  };

  // Execute Delete Draw
  const executeDelete = async () => {
    if (!selectedDraw) return;
    setIsSubmitting(true);
    
    try {
      await deleteDraw(selectedDraw.id);
      setShowDeleteConfirm(false);
      setSelectedDraw(null);
      Alert.alert('Success', 'Draw deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete draw');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Audit Modal
  const openAuditModal = async (draw: Draw) => {
    setSelectedDraw(draw);
    setIsLoadingAudit(true);
    setShowAuditModal(true);
    
    try {
      const data = await fetchDrawAudit(draw.id);
      setAuditData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load audit data');
      setShowAuditModal(false);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Export Audit Report
  const handleExportAudit = async () => {
    if (!selectedDraw) return;
    
    try {
      const exportData = await exportDrawAudit(selectedDraw.id);
      const jsonString = JSON.stringify(exportData, null, 2);
      
      if (Platform.OS === 'web') {
        // Web: Download as file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_report_${selectedDraw.id}_${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Audit report downloaded!');
      } else {
        // Mobile: Share
        await Share.share({
          message: jsonString,
          title: `Audit Report - ${selectedDraw.draw_type} Draw`
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export audit report');
    }
  };

  // Show Complete Confirmation
  const confirmComplete = (draw: Draw) => {
    setSelectedDraw(draw);
    setShowCompleteConfirm(true);
  };

  // Execute Complete
  const executeComplete = async () => {
    if (!selectedDraw) return;
    setIsSubmitting(true);
    
    try {
      const result = await completeDraw(selectedDraw.id);
      setShowCompleteConfirm(false);
      setSelectedDraw(null);
      Alert.alert('Success', `Draw completed! ${result.winners?.length || 0} winner(s) selected.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete draw');
    } finally {
      setIsSubmitting(false);
    }
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
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDrawDate(selectedDate);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedTime) setDrawTime(selectedTime);
  };

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

  const NativeDateTimePicker = () => (
    <View style={styles.dateTimeRow}>
      <View style={styles.datePickerContainer}>
        <Text style={styles.pickerLabel}>Draw Date</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar" size={20} color="#2563EB" />
          <Text style={styles.pickerButtonText}>{format(drawDate, 'MMM d, yyyy')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={drawDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} minimumDate={new Date()} />
        )}
      </View>
      <View style={styles.timePickerContainer}>
        <Text style={styles.pickerLabel}>Time</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time" size={20} color="#2563EB" />
          <Text style={styles.pickerButtonText}>{format(drawTime, 'h:mm a')}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker value={drawTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
        )}
      </View>
    </View>
  );

  const renderTableRow = ({ item, index }: { item: Draw; index: number }) => (
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
          {item.draw_date && (
            <Text style={styles.drawTime}>Draw: {format(new Date(item.draw_date), 'h:mm a')}</Text>
          )}
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
        <View style={styles.actionButtons}>
          {item.status === 'active' && (
            <>
              <TouchableOpacity style={[styles.actionIconBtn, styles.editBtn]} onPress={() => openEditModal(item)}>
                <Ionicons name="pencil" size={16} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionIconBtn, styles.completeBtn]} onPress={() => confirmComplete(item)}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionIconBtn, styles.deleteBtn]} onPress={() => confirmDelete(item)}>
                <Ionicons name="trash" size={16} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          {item.status === 'completed' && (
            <TouchableOpacity style={[styles.actionIconBtn, styles.auditBtn]} onPress={() => openAuditModal(item)}>
              <Ionicons name="shield-checkmark" size={16} color="#2563EB" />
            </TouchableOpacity>
          )}
          {item.status === 'cancelled' && (
            <Text style={styles.cancelledText}>Cancelled</Text>
          )}
        </View>
      </View>
    </View>
  );

  const period = getDrawPeriod();

  // Draw Form Content (shared between create/edit)
  const DrawFormContent = ({ isEdit }: { isEdit: boolean }) => (
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

      <View style={styles.periodPreview}>
        <View style={styles.periodIcon}>
          <Ionicons name="calendar-outline" size={20} color="#2563EB" />
        </View>
        <View style={styles.periodInfo}>
          <Text style={styles.periodLabel}>Draw Period</Text>
          <Text style={styles.periodDates}>{period.start} → {period.end}</Text>
          <Text style={styles.periodDays}>{period.days > 0 ? `${period.days} days from now` : 'Today'}</Text>
        </View>
      </View>

      <View style={styles.prizesHeader}>
        <Text style={styles.label}>Prizes ({prizes.length})</Text>
        <TouchableOpacity onPress={openAddPrizeModal}>
          <Text style={styles.addPrizeLink}>+ Add Prize</Text>
        </TouchableOpacity>
      </View>

      {prizes.map((p, i) => (
        <TouchableOpacity key={i} style={styles.prizeItem} onPress={() => openEditPrizeModal(i)} activeOpacity={0.7}>
          <Ionicons name={p.prize_type === 'item' ? 'gift' : 'cash'} size={20} color={p.prize_type === 'item' ? '#F59E0B' : '#10B981'} />
          <View style={styles.prizeItemInfo}>
            <Text style={styles.prizeItemName}>{p.name}</Text>
            <Text style={styles.prizeItemValue}>
              {p.prize_type === 'item' ? p.item_name : `${currencySymbol} ${p.amount?.toLocaleString()}`} • {p.winners} winner(s)
            </Text>
          </View>
          <View style={styles.prizeActions}>
            <TouchableOpacity style={styles.prizeEditBtn} onPress={() => openEditPrizeModal(i)}>
              <Ionicons name="pencil" size={16} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.prizeDeleteBtn} onPress={() => confirmDeletePrize(i)}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.submitBtn} onPress={isEdit ? confirmUpdate : confirmCreate}>
        <Text style={styles.submitBtnText}>{isEdit ? 'Update Draw' : 'Create Draw'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Confirmation Modal Component
  const ConfirmationModal = ({ 
    visible, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText, 
    confirmColor,
    icon,
    iconColor
  }: {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    icon: string;
    iconColor: string;
  }) => (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <View style={[styles.confirmIconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon as any} size={48} color={iconColor} />
          </View>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmText}>{message}</Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmActionBtn, { backgroundColor: confirmColor }]} 
              onPress={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={icon as any} size={18} color="#fff" />
                  <Text style={styles.confirmActionBtnText}>{confirmText}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="Draws" 
        subtitle={`${draws.length} total draws`}
        rightContent={
          <TouchableOpacity style={styles.createBtn} onPress={openCreateModal} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>New Draw</Text>
          </TouchableOpacity>
        }
      />
      
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
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Actions</Text>
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

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Draw</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <DrawFormContent isEdit={false} />
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Draw</Text>
                <Text style={styles.modalSubtitle}>{editingDraw?.draw_type?.charAt(0).toUpperCase()}{editingDraw?.draw_type?.slice(1)} Draw</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowEditModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <DrawFormContent isEdit={true} />
          </View>
        </View>
      </Modal>

      {/* Add/Edit Prize Modal */}
      <Modal visible={showPrizeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingPrizeIndex !== null ? 'Edit Prize' : 'Add Prize'}</Text>
              <TouchableOpacity onPress={() => { setShowPrizeModal(false); resetPrizeForm(); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Prize Name *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Grand Prize" 
                value={prizeName} 
                onChangeText={setPrizeName} 
                placeholderTextColor="#9CA3AF" 
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, prizeType === 'money' && styles.typeBtnActive]} 
                  onPress={() => setPrizeType('money')}
                >
                  <Ionicons name="cash" size={18} color={prizeType === 'money' ? '#fff' : '#10B981'} />
                  <Text style={[styles.typeBtnText, prizeType === 'money' && styles.typeBtnTextActive]}>Money</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, prizeType === 'item' && styles.typeBtnActive]} 
                  onPress={() => setPrizeType('item')}
                >
                  <Ionicons name="gift" size={18} color={prizeType === 'item' ? '#fff' : '#F59E0B'} />
                  <Text style={[styles.typeBtnText, prizeType === 'item' && styles.typeBtnTextActive]}>Item</Text>
                </TouchableOpacity>
              </View>

              {prizeType === 'money' ? (
                <>
                  <Text style={styles.label}>Amount ({currencySymbol}) *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="10000" 
                    keyboardType="numeric" 
                    value={prizeAmount} 
                    onChangeText={setPrizeAmount} 
                    placeholderTextColor="#9CA3AF" 
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Item Name *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Toyota Corolla" 
                    value={prizeItem} 
                    onChangeText={setPrizeItem} 
                    placeholderTextColor="#9CA3AF" 
                  />
                  <Text style={styles.label}>Image URL (optional)</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="https://..." 
                    value={prizeImage} 
                    onChangeText={setPrizeImage} 
                    placeholderTextColor="#9CA3AF" 
                  />
                </>
              )}

              <Text style={styles.label}>Number of Winners *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="1" 
                keyboardType="numeric" 
                value={prizeWinners} 
                onChangeText={setPrizeWinners} 
                placeholderTextColor="#9CA3AF" 
              />

              <TouchableOpacity style={styles.submitBtn} onPress={savePrize}>
                <Text style={styles.submitBtnText}>{editingPrizeIndex !== null ? 'Update Prize' : 'Add Prize'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Confirmation Modal */}
      <ConfirmationModal
        visible={showCreateConfirm}
        onClose={() => setShowCreateConfirm(false)}
        onConfirm={executeCreate}
        title="Create Draw?"
        message={`Create a new ${drawType} draw scheduled for ${format(drawDate, 'MMM d, yyyy')} at ${format(drawTime, 'h:mm a')} with ${prizes.length} prize tier(s)?`}
        confirmText="Create"
        confirmColor="#2563EB"
        icon="add-circle"
        iconColor="#2563EB"
      />

      {/* Update Confirmation Modal */}
      <ConfirmationModal
        visible={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
        onConfirm={executeUpdate}
        title="Update Draw?"
        message={`Save changes to this ${drawType} draw? The draw will be updated with the new date, time, and prizes.`}
        confirmText="Update"
        confirmColor="#2563EB"
        icon="save"
        iconColor="#2563EB"
      />

      {/* Delete Draw Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setSelectedDraw(null); }}
        onConfirm={executeDelete}
        title="Delete Draw?"
        message={`Are you sure you want to delete the "${selectedDraw?.draw_type}" draw? This action cannot be undone and all entries will be lost.`}
        confirmText="Delete"
        confirmColor="#EF4444"
        icon="trash"
        iconColor="#EF4444"
      />

      {/* Complete Confirmation Modal */}
      <ConfirmationModal
        visible={showCompleteConfirm}
        onClose={() => { setShowCompleteConfirm(false); setSelectedDraw(null); }}
        onConfirm={executeComplete}
        title="Complete Draw?"
        message={`Complete the "${selectedDraw?.draw_type}" draw and randomly select winners? This will end the draw and notify winners.`}
        confirmText="Complete"
        confirmColor="#10B981"
        icon="checkmark-circle"
        iconColor="#10B981"
      />

      {/* Delete Prize Confirmation Modal */}
      <ConfirmationModal
        visible={showDeletePrizeConfirm}
        onClose={() => { setShowDeletePrizeConfirm(false); setPrizeToDeleteIndex(null); }}
        onConfirm={executeDeletePrize}
        title="Delete Prize?"
        message={`Are you sure you want to remove "${prizeToDeleteIndex !== null ? prizes[prizeToDeleteIndex]?.name : ''}" from this draw?`}
        confirmText="Delete"
        confirmColor="#EF4444"
        icon="trash"
        iconColor="#EF4444"
      />
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
  drawTime: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  actionCell: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: '#EFF6FF',
  },
  completeBtn: {
    backgroundColor: '#ECFDF5',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  completedText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelledText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
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
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalBody: {
    padding: 24,
    maxHeight: 450,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  prizeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  prizeEditBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  prizeDeleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
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
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 32,
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  confirmActionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmActionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
