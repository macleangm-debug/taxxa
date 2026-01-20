import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1200;

interface Country {
  id?: string;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  currency_name: string;
  timezone: string;
  tax_rate: number;
  phone_code: string;
  language: string;
  date_format: string;
  is_active: boolean;
}

const defaultCountry: Omit<Country, 'id'> = {
  name: '',
  code: '',
  currency_code: '',
  currency_symbol: '',
  currency_name: '',
  timezone: '',
  tax_rate: 0,
  phone_code: '',
  language: 'en',
  date_format: 'MM/DD/YYYY',
  is_active: true,
};

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Africa/Lagos', 'Africa/Nairobi',
  'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    countries, activeCountry, settings,
    fetchCountries, createCountry, updateCountry, deleteCountry,
    setActiveCountry, fetchSettings,
  } = useAdminStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countryForm, setCountryForm] = useState<Omit<Country, 'id'>>(defaultCountry);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchCountries(), fetchSettings()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCountries, fetchSettings]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddCountry = () => {
    setEditingCountry(null);
    setCountryForm(defaultCountry);
    setShowCountryModal(true);
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setCountryForm({ ...country });
    setShowCountryModal(true);
  };

  const handleSaveCountry = async () => {
    if (!countryForm.name || !countryForm.code || !countryForm.currency_code) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    try {
      if (editingCountry?.id) {
        await updateCountry(editingCountry.id, countryForm);
        Alert.alert('Success', 'Country updated');
      } else {
        await createCountry(countryForm);
        Alert.alert('Success', 'Country created');
      }
      setShowCountryModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleDeleteCountry = (country: Country) => {
    Alert.alert('Delete Country', `Delete ${country.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteCountry(country.id!);
          Alert.alert('Success', 'Deleted');
        } catch (e) {
          Alert.alert('Error', 'Failed to delete');
        }
      }},
    ]);
  };

  const handleSelectCountry = async (country: Country) => {
    try {
      await setActiveCountry(country.id!);
      Alert.alert('Success', `Switched to ${country.name}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to switch');
    }
  };

  const ViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleBtnActive]} onPress={() => setViewMode('cards')}>
        <Ionicons name="grid" size={16} color={viewMode === 'cards' ? '#fff' : '#6B7280'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]} onPress={() => setViewMode('table')}>
        <Ionicons name="list" size={16} color={viewMode === 'table' ? '#fff' : '#6B7280'} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>
        <View style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage countries and platform</Text>
          </View>
          <ViewToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          {/* Active Country */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="globe" size={18} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Active Country</Text>
            </View>
            {activeCountry ? (
              <View style={styles.activeCountryCard}>
                <View style={styles.activeCountryInfo}>
                  <Text style={styles.activeCountryName}>{activeCountry.name}</Text>
                  <Text style={styles.activeCountryDetails}>{activeCountry.currency_symbol} {activeCountry.currency_code} • {activeCountry.timezone}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noCountryCard}>
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                <Text style={styles.noCountryText}>No country selected</Text>
              </View>
            )}
          </View>

          {/* Countries */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="flag" size={18} color="#10B981" />
              </View>
              <Text style={styles.sectionTitle}>Countries</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddCountry}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {countries.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="earth" size={40} color="#9CA3AF" />
                <Text style={styles.emptyText}>No countries configured</Text>
              </View>
            ) : viewMode === 'cards' ? (
              <View style={styles.countriesGrid}>
                {countries.map((country) => (
                  <View key={country.id} style={[styles.countryCard, activeCountry?.id === country.id && styles.countryCardActive]}>
                    <TouchableOpacity style={styles.countryCardContent} onPress={() => handleSelectCountry(country)}>
                      <View style={styles.countryFlag}>
                        <Text style={styles.countryCode}>{country.code}</Text>
                      </View>
                      <View style={styles.countryInfo}>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.countryMeta}>{country.currency_symbol} {country.currency_code}</Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.countryActions}>
                      {activeCountry?.id === country.id && (
                        <View style={styles.activeIndicator}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        </View>
                      )}
                      <TouchableOpacity style={styles.actionIcon} onPress={() => handleEditCountry(country)}>
                        <Ionicons name="pencil" size={14} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => handleDeleteCountry(country)}>
                        <Ionicons name="trash" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Code</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Currency</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                </View>
                {countries.map((country) => (
                  <TouchableOpacity key={country.id} style={styles.tableRow} onPress={() => handleSelectCountry(country)}>
                    <Text style={[styles.tableCell, { flex: 1, fontWeight: '600', color: '#2563EB' }]}>{country.code}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{country.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{country.currency_symbol} {country.currency_code}</Text>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      {activeCountry?.id === country.id && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8 }]}>
                      <TouchableOpacity onPress={() => handleEditCountry(country)}>
                        <Ionicons name="pencil" size={16} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCountry(country)}>
                        <Ionicons name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Platform Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="settings" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionTitle}>Platform Settings</Text>
            </View>
            <View style={styles.settingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Scan Cooldown</Text>
                  <Text style={styles.settingDescription}>Seconds between scans</Text>
                </View>
                <Text style={styles.settingValue}>{settings?.scan_cooldown_seconds || 60}s</Text>
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Max Scans/Day</Text>
                  <Text style={styles.settingDescription}>Per user daily limit</Text>
                </View>
                <Text style={styles.settingValue}>{settings?.max_scans_per_day || 100}</Text>
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Entries Per Amount</Text>
                  <Text style={styles.settingDescription}>Spend for 1 entry</Text>
                </View>
                <Text style={styles.settingValue}>{activeCountry?.currency_symbol || '$'}{settings?.entries_per_amount || 50}</Text>
              </View>
              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Receipt Expiry</Text>
                  <Text style={styles.settingDescription}>Days until expire</Text>
                </View>
                <Text style={styles.settingValue}>{settings?.receipt_expiry_days || 30} days</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Country Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCountry ? 'Edit Country' : 'Add Country'}</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.formSectionTitle}>Basic Information</Text>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 2 }]}>
                  <Text style={styles.formLabel}>Country Name *</Text>
                  <TextInput style={styles.formInput} value={countryForm.name} onChangeText={(v) => setCountryForm({ ...countryForm, name: v })} placeholder="Nigeria" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Code *</Text>
                  <TextInput style={styles.formInput} value={countryForm.code} onChangeText={(v) => setCountryForm({ ...countryForm, code: v.toUpperCase() })} placeholder="NG" placeholderTextColor="#9CA3AF" maxLength={3} />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Code</Text>
                <TextInput style={styles.formInput} value={countryForm.phone_code} onChangeText={(v) => setCountryForm({ ...countryForm, phone_code: v })} placeholder="+234" placeholderTextColor="#9CA3AF" />
              </View>

              <Text style={styles.formSectionTitle}>Currency</Text>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Code *</Text>
                  <TextInput style={styles.formInput} value={countryForm.currency_code} onChangeText={(v) => setCountryForm({ ...countryForm, currency_code: v.toUpperCase() })} placeholder="NGN" placeholderTextColor="#9CA3AF" maxLength={3} />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Symbol</Text>
                  <TextInput style={styles.formInput} value={countryForm.currency_symbol} onChangeText={(v) => setCountryForm({ ...countryForm, currency_symbol: v })} placeholder="₦" placeholderTextColor="#9CA3AF" maxLength={5} />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Currency Name</Text>
                <TextInput style={styles.formInput} value={countryForm.currency_name} onChangeText={(v) => setCountryForm({ ...countryForm, currency_name: v })} placeholder="Nigerian Naira" placeholderTextColor="#9CA3AF" />
              </View>

              <Text style={styles.formSectionTitle}>Regional</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Timezone</Text>
                <TouchableOpacity style={styles.formSelect} onPress={() => setShowTimezoneDropdown(!showTimezoneDropdown)}>
                  <Text style={countryForm.timezone ? styles.formSelectText : styles.formSelectPlaceholder}>{countryForm.timezone || 'Select timezone'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showTimezoneDropdown && (
                  <View style={styles.dropdown}>
                    {TIMEZONES.map((tz) => (
                      <TouchableOpacity key={tz} style={styles.dropdownItem} onPress={() => { setCountryForm({ ...countryForm, timezone: tz }); setShowTimezoneDropdown(false); }}>
                        <Text style={styles.dropdownItemText}>{tz}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tax Rate (%)</Text>
                <TextInput style={styles.formInput} value={countryForm.tax_rate.toString()} onChangeText={(v) => setCountryForm({ ...countryForm, tax_rate: parseFloat(v) || 0 })} placeholder="7.5" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
              </View>
              <View style={[styles.formRow, { alignItems: 'center', marginTop: 8 }]}>
                <Text style={styles.formLabel}>Active</Text>
                <Switch value={countryForm.is_active} onValueChange={(v) => setCountryForm({ ...countryForm, is_active: v })} trackColor={{ false: '#D1D5DB', true: '#10B981' }} thumbColor="#fff" />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setShowCountryModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalSaveBtn]} onPress={handleSaveCountry}>
                <Text style={styles.modalSaveBtnText}>{editingCountry ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, maxWidth: MAX_WIDTH, alignSelf: 'center', width: '100%' },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  viewToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 2 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  
  scrollContent: { paddingVertical: 20, alignItems: isWeb ? 'center' : undefined },
  contentContainer: { width: '100%', maxWidth: MAX_WIDTH, paddingHorizontal: 20 },
  
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  
  activeCountryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#10B981' },
  activeCountryInfo: { flex: 1 },
  activeCountryName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  activeCountryDetails: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  activeBadgeText: { color: '#10B981', fontWeight: '600', fontSize: 12 },
  noCountryCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  noCountryText: { flex: 1, color: '#92400E', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 12 },
  emptyText: { color: '#6B7280', fontSize: 16, marginTop: 12 },
  
  countriesGrid: { gap: 10 },
  countryCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  countryCardActive: { borderWidth: 2, borderColor: '#10B981' },
  countryCardContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  countryFlag: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  countryCode: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  countryInfo: { flex: 1 },
  countryName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  countryMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  countryActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F9FAFB', gap: 8 },
  activeIndicator: { marginRight: 'auto' },
  actionIcon: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  
  tableContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  tableCell: { fontSize: 14, color: '#111827' },
  statusBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
  
  settingsCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#111827' },
  settingDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  settingValue: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: '#F3F4F6' },
  modalSaveBtn: { backgroundColor: '#2563EB' },
  modalCancelBtnText: { color: '#374151', fontWeight: '600' },
  modalSaveBtnText: { color: '#fff', fontWeight: '600' },
  
  formSectionTitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 16, marginBottom: 12, textTransform: 'uppercase' },
  formRow: { flexDirection: 'row', gap: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '500' },
  formInput: { backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  formSelect: { backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB' },
  formSelectText: { fontSize: 14, color: '#111827' },
  formSelectPlaceholder: { fontSize: 14, color: '#9CA3AF' },
  dropdown: { backgroundColor: '#fff', borderRadius: 8, marginTop: 4, maxHeight: 150, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'scroll' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 14, color: '#111827' },
});
