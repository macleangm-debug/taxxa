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

// Common timezones
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

// Common date formats
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
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
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
            <Ionicons name="globe" size={22} color="#3B82F6" />
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
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => Alert.alert('Change Country', 'Select a country from the list below')}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noCountryCard}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <Text style={styles.noCountryText}>No country selected. Add and select a country below.</Text>
            </View>
          )}
        </View>

        {/* Countries List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={22} color="#10B981" />
            <Text style={styles.sectionTitle}>Countries</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCountry}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Country</Text>
            </TouchableOpacity>
          </View>

          {countries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="earth" size={48} color="#64748B" />
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
                        <Ionicons name="cash" size={14} color="#64748B" />
                        <Text style={styles.countryDetailText}>{country.currency_name}</Text>
                      </View>
                      <View style={styles.countryDetail}>
                        <Ionicons name="time" size={14} color="#64748B" />
                        <Text style={styles.countryDetailText}>{country.timezone}</Text>
                      </View>
                      <View style={styles.countryDetail}>
                        <Ionicons name="receipt" size={14} color="#64748B" />
                        <Text style={styles.countryDetailText}>{country.tax_rate}% tax</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.countryActions}>
                    {activeCountry?.id === country.id && (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => handleEditCountry(country)}
                    >
                      <Ionicons name="pencil" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => handleDeleteCountry(country)}
                    >
                      <Ionicons name="trash" size={18} color="#EF4444" />
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
            <Ionicons name="settings" size={22} color="#8B5CF6" />
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
            
            <View style={styles.settingRow}>
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
                <Ionicons name="close" size={24} color="#94A3B8" />
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
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Code *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={countryForm.code}
                    onChangeText={(v) => setCountryForm({ ...countryForm, code: v.toUpperCase() })}
                    placeholder="NG"
                    placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
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
                    placeholderTextColor="#64748B"
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
                    placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
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
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
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
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
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
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Active</Text>
                <Switch
                  value={countryForm.is_active}
                  onValueChange={(v) => setCountryForm({ ...countryForm, is_active: v })}
                  trackColor={{ false: '#374151', true: '#10B981' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowCountryModal(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSaveBtn]}
                onPress={handleSaveCountry}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.modalBtnText}>
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
  headerTitleContainer: {},
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  section: { marginBottom: 24 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  
  activeCountryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  activeCountryInfo: { flex: 1 },
  activeCountryName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  activeCountryDetails: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  changeButton: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeButtonText: { color: '#3B82F6', fontWeight: '600' },
  
  noCountryCard: {
    backgroundColor: '#422006',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noCountryText: { flex: 1, color: '#FCD34D', fontSize: 14 },
  
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 12 },
  emptySubtext: { color: '#64748B', fontSize: 14, marginTop: 4 },
  
  countriesList: { gap: 12 },
  countryCard: {
    backgroundColor: '#1E293B',
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
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCode: { fontSize: 14, fontWeight: 'bold', color: '#3B82F6' },
  countryInfo: { marginLeft: 12, flex: 1 },
  countryName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  countryMeta: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  countryDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  countryDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countryDetailText: { fontSize: 12, color: '#94A3B8' },
  countryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    gap: 12,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginRight: 'auto',
  },
  activeBadgeText: { color: '#10B981', fontSize: 12, fontWeight: '500' },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  settingsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#fff' },
  settingDescription: { fontSize: 12, color: '#64748B', marginTop: 2 },
  settingValue: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  modalContent: { 
    backgroundColor: '#1E293B', 
    borderRadius: 20, 
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
    borderBottomColor: '#334155',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { 
    flexDirection: 'row', 
    gap: 12, 
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
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
  modalCancelBtn: { backgroundColor: '#374151' },
  modalSaveBtn: { backgroundColor: '#3B82F6' },
  modalBtnText: { color: '#fff', fontWeight: '600' },
  
  formSectionTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#94A3B8', 
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  formRow: { flexDirection: 'row', gap: 12 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, color: '#94A3B8', marginBottom: 6 },
  formInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
  },
  formSelect: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formSelectText: { fontSize: 14, color: '#fff' },
  formSelectPlaceholder: { fontSize: 14, color: '#64748B' },
  dropdown: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
    overflow: 'scroll',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  dropdownItemText: { fontSize: 14, color: '#fff' },
});
