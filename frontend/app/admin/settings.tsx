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
  Dimensions,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const { width } = Dimensions.get('window');

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
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const DATE_FORMATS = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
];

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    countries, 
    activeCountry, 
    settings,
    fetchCountries, 
    createCountry, 
    updateCountry, 
    deleteCountry,
    setActiveCountry,
    fetchSettings,
    updateSettings,
  } = useAdminStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countryForm, setCountryForm] = useState<Omit<Country, 'id'>>(defaultCountry);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCountry = () => {
    setEditingCountry(null);
    setCountryForm(defaultCountry);
    setShowCountryModal(true);
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country as Country);
    setCountryForm({
      name: country.name,
      code: country.code,
      currency_code: country.currency_code,
      currency_symbol: country.currency_symbol,
      currency_name: country.currency_name,
      timezone: country.timezone,
      tax_rate: country.tax_rate,
      phone_code: country.phone_code,
      language: country.language,
      date_format: country.date_format,
      is_active: country.is_active,
    });
    setShowCountryModal(true);
  };

  const handleSaveCountry = async () => {
    if (!countryForm.name || !countryForm.code || !countryForm.currency_code) {
      Alert.alert('Error', 'Please fill in required fields (Name, Code, Currency)');
      return;
    }

    try {
      if (editingCountry?.id) {
        await updateCountry(editingCountry.id, countryForm);
        Alert.alert('Success', 'Country updated successfully');
      } else {
        await createCountry(countryForm);
        Alert.alert('Success', 'Country created successfully');
      }
      setShowCountryModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save country');
    }
  };

  const handleDeleteCountry = (country: Country) => {
    Alert.alert(
      'Delete Country',
      `Are you sure you want to delete ${country.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCountry(country.id!);
              Alert.alert('Success', 'Country deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete country');
            }
          },
        },
      ]
    );
  };

  const handleSelectCountry = async (country: Country) => {
    try {
      await setActiveCountry(country.id!);
      Alert.alert('Success', `Switched to ${country.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch country');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage countries and platform settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Active Country Selector */}
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
              <Text style={styles.noCountryText}>No country selected. Add and select a country below.</Text>
            </View>
          )}
        </View>

        {/* Countries List */}
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
              <Text style={styles.emptySubtext}>Add countries where draws will take place</Text>
            </View>
          ) : (
            <View style={styles.countriesList}>
              {countries.map((country) => (
                <View key={country.id} style={[
                  styles.countryCard,
                  activeCountry?.id === country.id && styles.countryCardActive
                ]}>
                  <TouchableOpacity 
                    style={styles.countryCardContent}
                    onPress={() => handleSelectCountry(country)}
                  >
                    <View style={styles.countryMain}>
                      <View style={styles.countryFlag}>
                        <Text style={styles.countryCode}>{country.code}</Text>
                      </View>
                      <View style={styles.countryInfo}>
                        <Text style={styles.countryName}>{country.name}</Text>
                        <Text style={styles.countryMeta}>
                          {country.currency_symbol} {country.currency_code} • {country.phone_code}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.countryDetails}>
                      <View style={styles.countryDetail}>
                        <Ionicons name="cash" size={12} color="#6B7280" />
                        <Text style={styles.countryDetailText}>{country.currency_name}</Text>
                      </View>
                      <View style={styles.countryDetail}>
                        <Ionicons name="time" size={12} color="#6B7280" />
                        <Text style={styles.countryDetailText}>{country.timezone}</Text>
                      </View>
                      <View style={styles.countryDetail}>
                        <Ionicons name="receipt" size={12} color="#6B7280" />
                        <Text style={styles.countryDetailText}>{country.tax_rate}% tax</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.countryActions}>
                    {activeCountry?.id === country.id && (
                      <View style={styles.activeIndicator}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.activeIndicatorText}>Active</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => handleEditCountry(country)}
                    >
                      <Ionicons name="pencil" size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => handleDeleteCountry(country)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
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
                <Text style={styles.settingDescription}>Minimum seconds between scans</Text>
              </View>
              <Text style={styles.settingValue}>{settings?.scan_cooldown_seconds || 60}s</Text>
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Max Scans Per Day</Text>
                <Text style={styles.settingDescription}>Maximum scans allowed per user daily</Text>
              </View>
              <Text style={styles.settingValue}>{settings?.max_scans_per_day || 100}</Text>
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Entries Per Amount</Text>
                <Text style={styles.settingDescription}>Amount spent for 1 draw entry</Text>
              </View>
              <Text style={styles.settingValue}>{activeCountry?.currency_symbol || '$'}{settings?.entries_per_amount || 50}</Text>
            </View>
            
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Receipt Expiry</Text>
                <Text style={styles.settingDescription}>Days until receipts expire</Text>
              </View>
              <Text style={styles.settingValue}>{settings?.receipt_expiry_days || 30} days</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Country Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCountry ? 'Edit Country' : 'Add Country'}
              </Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Basic Info */}
              <Text style={styles.formSectionTitle}>Basic Information</Text>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 2 }]}>
                  <Text style={styles.formLabel}>Country Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={countryForm.name}
                    onChangeText={(v) => setCountryForm({ ...countryForm, name: v })}
                    placeholder="e.g., Nigeria"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Code *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={countryForm.code}
                    onChangeText={(v) => setCountryForm({ ...countryForm, code: v.toUpperCase() })}
                    placeholder="NG"
                    placeholderTextColor="#9CA3AF"
                    maxLength={3}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Code</Text>
                <TextInput
                  style={styles.formInput}
                  value={countryForm.phone_code}
                  onChangeText={(v) => setCountryForm({ ...countryForm, phone_code: v })}
                  placeholder="+234"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Currency Info */}
              <Text style={styles.formSectionTitle}>Currency Settings</Text>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Currency Code *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={countryForm.currency_code}
                    onChangeText={(v) => setCountryForm({ ...countryForm, currency_code: v.toUpperCase() })}
                    placeholder="NGN"
                    placeholderTextColor="#9CA3AF"
                    maxLength={3}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Symbol</Text>
                  <TextInput
                    style={styles.formInput}
                    value={countryForm.currency_symbol}
                    onChangeText={(v) => setCountryForm({ ...countryForm, currency_symbol: v })}
                    placeholder="₦"
                    placeholderTextColor="#9CA3AF"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Currency Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={countryForm.currency_name}
                  onChangeText={(v) => setCountryForm({ ...countryForm, currency_name: v })}
                  placeholder="Nigerian Naira"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Regional Settings */}
              <Text style={styles.formSectionTitle}>Regional Settings</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Timezone</Text>
                <TouchableOpacity 
                  style={styles.formSelect}
                  onPress={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                >
                  <Text style={countryForm.timezone ? styles.formSelectText : styles.formSelectPlaceholder}>
                    {countryForm.timezone || 'Select timezone'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showTimezoneDropdown && (
                  <View style={styles.dropdown}>
                    {TIMEZONES.map((tz) => (
                      <TouchableOpacity
                        key={tz}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCountryForm({ ...countryForm, timezone: tz });
                          setShowTimezoneDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{tz}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date Format</Text>
                <TouchableOpacity 
                  style={styles.formSelect}
                  onPress={() => setShowDateFormatDropdown(!showDateFormatDropdown)}
                >
                  <Text style={countryForm.date_format ? styles.formSelectText : styles.formSelectPlaceholder}>
                    {countryForm.date_format || 'Select format'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showDateFormatDropdown && (
                  <View style={styles.dropdown}>
                    {DATE_FORMATS.map((df) => (
                      <TouchableOpacity
                        key={df}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCountryForm({ ...countryForm, date_format: df });
                          setShowDateFormatDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{df}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Default Tax Rate (%)</Text>
                <TextInput
                  style={styles.formInput}
                  value={countryForm.tax_rate.toString()}
                  onChangeText={(v) => setCountryForm({ ...countryForm, tax_rate: parseFloat(v) || 0 })}
                  placeholder="7.5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.formRow, { alignItems: 'center', marginTop: 8 }]}>
                <Text style={styles.formLabel}>Active</Text>
                <Switch
                  value={countryForm.is_active}
                  onValueChange={(v) => setCountryForm({ ...countryForm, is_active: v })}
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowCountryModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSaveBtn]}
                onPress={handleSaveCountry}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.modalSaveBtnText}>
                  {editingCountry ? 'Update' : 'Add Country'}
                </Text>
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 10, 
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16 
  },
  headerTitleContainer: {},
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  section: { marginBottom: 24 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  
  activeCountryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  activeCountryInfo: { flex: 1 },
  activeCountryName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  activeCountryDetails: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  activeBadgeText: { color: '#10B981', fontWeight: '600', fontSize: 12 },
  
  noCountryCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noCountryText: { flex: 1, color: '#92400E', fontSize: 14 },
  
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 12 },
  emptyText: { color: '#6B7280', fontSize: 16, marginTop: 12, fontWeight: '500' },
  emptySubtext: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
  
  countriesList: { gap: 10 },
  countryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCardActive: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  countryCardContent: { padding: 16 },
  countryMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  countryFlag: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCode: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  countryInfo: { marginLeft: 12, flex: 1 },
  countryName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  countryMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  countryDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  countryDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countryDetailText: { fontSize: 12, color: '#6B7280' },
  countryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginRight: 'auto',
  },
  activeIndicatorText: { color: '#10B981', fontSize: 12, fontWeight: '500' },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#111827' },
  settingDescription: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  settingValue: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    width: '100%', 
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { 
    flexDirection: 'row', 
    gap: 12, 
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, 
    borderRadius: 10,
    gap: 6,
  },
  modalCancelBtn: { backgroundColor: '#F3F4F6' },
  modalSaveBtn: { backgroundColor: '#2563EB' },
  modalCancelBtnText: { color: '#374151', fontWeight: '600' },
  modalSaveBtnText: { color: '#fff', fontWeight: '600' },
  
  formSectionTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#6B7280', 
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formRow: { flexDirection: 'row', gap: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '500' },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formSelect: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formSelectText: { fontSize: 14, color: '#111827' },
  formSelectPlaceholder: { fontSize: 14, color: '#9CA3AF' },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'scroll',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: { fontSize: 14, color: '#111827' },
});
