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
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';

const isWeb = Platform.OS === 'web';

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

export default function SettingsScreen() {
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

  if (isLoading) {
    return (
      <AdminLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </AdminLayout>
    );
  }

  const content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Active Country Card */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="globe" size={20} color="#2563EB" />
          </View>
          <Text style={styles.sectionTitle}>Active Country</Text>
        </View>
        {activeCountry ? (
          <View style={styles.activeCountryCard}>
            <View style={styles.activeCountryInfo}>
              <Text style={styles.activeCountryName}>{activeCountry.name}</Text>
              <Text style={styles.activeCountryDetails}>
                {activeCountry.currency_symbol} {activeCountry.currency_code} • {activeCountry.timezone}
              </Text>
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

      {/* Countries Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="flag" size={20} color="#10B981" />
          </View>
          <Text style={styles.sectionTitle}>Countries</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCountry}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {countries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="earth" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No countries configured</Text>
            <Text style={styles.emptyText}>Add your first country to get started</Text>
          </View>
        ) : (
          <View style={styles.countriesTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Code</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Name</Text>
              <Text style={styles.tableHeaderCell}>Currency</Text>
              <Text style={styles.tableHeaderCell}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Actions</Text>
            </View>
            {countries.map((country, index) => (
              <TouchableOpacity 
                key={country.id} 
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                onPress={() => handleSelectCountry(country)}
              >
                <View style={[styles.tableCell, { flex: 0.8 }]}>
                  <View style={styles.codeCell}>
                    <Text style={styles.countryCode}>{country.code}</Text>
                  </View>
                </View>
                <Text style={[styles.tableCell, { flex: 2 }]}>{country.name}</Text>
                <Text style={styles.tableCell}>{country.currency_symbol} {country.currency_code}</Text>
                <View style={styles.tableCell}>
                  {activeCountry?.id === country.id ? (
                    <View style={styles.statusBadgeActive}>
                      <View style={styles.statusDotActive} />
                      <Text style={styles.statusTextActive}>Active</Text>
                    </View>
                  ) : (
                    <Text style={styles.inactiveText}>-</Text>
                  )}
                </View>
                <View style={[styles.tableCell, { flex: 0.8 }]}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleEditCountry(country)}>
                      <Ionicons name="pencil" size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDeleteCountry(country)}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
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
            <Ionicons name="settings" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.sectionTitle}>Platform Settings</Text>
        </View>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Scan Cooldown</Text>
              <Text style={styles.settingDescription}>Minimum seconds between scans</Text>
            </View>
            <Text style={styles.settingValue}>{settings?.scan_cooldown_seconds || 60}s</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Max Scans/Day</Text>
              <Text style={styles.settingDescription}>Maximum scans per user daily</Text>
            </View>
            <Text style={styles.settingValue}>{settings?.max_scans_per_day || 100}</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Entries Per Amount</Text>
              <Text style={styles.settingDescription}>Spend required for 1 entry</Text>
            </View>
            <Text style={styles.settingValue}>{activeCountry?.currency_symbol || '$'}{settings?.entries_per_amount || 50}</Text>
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Receipt Expiry</Text>
              <Text style={styles.settingDescription}>Days until receipt expires</Text>
            </View>
            <Text style={styles.settingValue}>{settings?.receipt_expiry_days || 30} days</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="Settings" 
        subtitle="Configure platform and countries"
      />
      {content}

      {/* Country Modal */}
      <Modal visible={showCountryModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCountry ? 'Edit Country' : 'Add Country'}</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
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
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>
                {showTimezoneDropdown && (
                  <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 150 }}>
                      {TIMEZONES.map((tz) => (
                        <TouchableOpacity key={tz} style={styles.dropdownItem} onPress={() => { setCountryForm({ ...countryForm, timezone: tz }); setShowTimezoneDropdown(false); }}>
                          <Text style={styles.dropdownItemText}>{tz}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tax Rate (%)</Text>
                <TextInput style={styles.formInput} value={countryForm.tax_rate.toString()} onChangeText={(v) => setCountryForm({ ...countryForm, tax_rate: parseFloat(v) || 0 })} placeholder="7.5" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
              </View>
              <View style={[styles.formRow, { alignItems: 'center', marginTop: 16 }]}>
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
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  activeCountryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  activeCountryInfo: {
    flex: 1,
  },
  activeCountryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  activeCountryDetails: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  activeBadgeText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  noCountryCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noCountryText: {
    flex: 1,
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  countriesTable: {
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
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  codeCell: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  inactiveText: {
    color: '#94A3B8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  settingDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
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
    maxHeight: '90%',
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
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  modalSaveBtn: {
    backgroundColor: '#2563EB',
  },
  modalCancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  modalSaveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formSelect: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formSelectText: {
    fontSize: 14,
    color: '#1E293B',
  },
  formSelectPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1E293B',
  },
});
