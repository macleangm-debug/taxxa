import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function AdminDashboard() {
  const router = useRouter();
  const { 
    dashboard, 
    fetchDashboard, 
    logout,
    countries,
    activeCountry,
    fetchCountries,
    setActiveCountry,
  } = useAdminStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadData = useCallback(async () => {
    try {
      await fetchCountries();
      await fetchDashboard();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }, [fetchDashboard, fetchCountries]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeCountry) {
      fetchDashboard();
    }
  }, [activeCountry, fetchDashboard]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const handleCountryChange = async (countryId: string) => {
    await setActiveCountry(countryId);
    setShowCountryPicker(false);
  };

  const ViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleBtnActive]}
        onPress={() => setViewMode('cards')}
      >
        <Ionicons name="grid" size={16} color={viewMode === 'cards' ? '#fff' : '#6B7280'} />
        <Text style={[styles.toggleText, viewMode === 'cards' && styles.toggleTextActive]}>Cards</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
        onPress={() => setViewMode('table')}
      >
        <Ionicons name="list" size={16} color={viewMode === 'table' ? '#fff' : '#6B7280'} />
        <Text style={[styles.toggleText, viewMode === 'table' && styles.toggleTextActive]}>Table</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTableView = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Metric</Text>
        <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Total Value</Text>
        <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Today's Change</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
      </View>
      {[
        { name: 'Total Users', icon: 'people', color: '#2563EB', total: dashboard?.overview?.total_users || 0, today: dashboard?.today?.new_users || 0, status: 'Active' },
        { name: 'Total Scans', icon: 'scan', color: '#10B981', total: dashboard?.overview?.total_scans || 0, today: dashboard?.today?.scans || 0, status: 'Active' },
        { name: 'Valid Scans', icon: 'checkmark-circle', color: '#10B981', total: dashboard?.overview?.valid_scans || 0, today: dashboard?.today?.valid_scans || 0, status: 'Active' },
        { name: 'Active Draws', icon: 'trophy', color: '#F59E0B', total: dashboard?.overview?.active_draws || 0, today: '-', status: 'Running' },
      ].map((item, i) => (
        <View key={i} style={[styles.tableRow, i === 3 && { borderBottomWidth: 0 }]}>
          <View style={[styles.tableCell, { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
            <View style={[styles.tableIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.tableCellText}>{item.name}</Text>
          </View>
          <Text style={[styles.tableCellValue, { flex: 2, textAlign: 'center' }]}>{item.total.toLocaleString()}</Text>
          <Text style={[styles.tableCellChange, { flex: 2, textAlign: 'center', color: item.today === '-' ? '#6B7280' : '#10B981' }]}>
            {item.today === '-' ? '-' : `+${item.today}`}
          </Text>
          <View style={[styles.tableCell, { flex: 1.5, alignItems: 'center' }]}>
            <View style={[styles.statusBadge, item.status === 'Running' && styles.statusBadgeWarning]}>
              <Text style={[styles.statusText, item.status === 'Running' && styles.statusTextWarning]}>{item.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const menuItems = [
    { title: 'Users', icon: 'people', color: '#2563EB', route: '/admin/users', desc: 'View and manage' },
    { title: 'Draws', icon: 'trophy', color: '#F59E0B', route: '/admin/draws', desc: 'Create draws' },
    { title: 'Scans', icon: 'scan', color: '#10B981', route: '/admin/scans', desc: 'Scan records' },
    { title: 'Analytics', icon: 'bar-chart', color: '#8B5CF6', route: '/admin/analytics', desc: 'View reports' },
    { title: 'Fraud', icon: 'shield', color: '#EF4444', route: '/admin/fraud', desc: 'Monitor activity' },
    { title: 'Settings', icon: 'settings', color: '#6B7280', route: '/admin/settings', desc: 'Configuration' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.countryBtn} onPress={() => setShowCountryPicker(true)}>
              <Ionicons name="globe-outline" size={18} color="#2563EB" />
              <Text style={styles.countryBtnText}>{activeCountry?.code || 'All'}</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* Active Country Banner */}
        {activeCountry && (
          <View style={styles.countryBanner}>
            <View style={styles.countryFlag}>
              <Text style={styles.countryFlagText}>{activeCountry.code}</Text>
            </View>
            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>{activeCountry.name}</Text>
              <Text style={styles.countryCurrency}>{activeCountry.currency_symbol} {activeCountry.currency_code}</Text>
            </View>
          </View>
        )}

        {/* Section Header with Toggle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <ViewToggle />
        </View>

        {/* Stats - Cards or Table */}
        {viewMode === 'cards' ? (
          <>
            <View style={styles.statsGrid}>
              {[
                { title: 'Users', value: dashboard?.overview?.total_users || 0, icon: 'people', color: '#2563EB' },
                { title: 'Scans', value: dashboard?.overview?.total_scans || 0, icon: 'scan', color: '#10B981' },
                { title: 'Valid', value: dashboard?.overview?.valid_scans || 0, icon: 'checkmark-circle', color: '#10B981' },
                { title: 'Draws', value: dashboard?.overview?.active_draws || 0, icon: 'trophy', color: '#F59E0B' },
              ].map((stat, i) => (
                <View key={i} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                    <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              ))}
            </View>

            {/* Today's Activity */}
            <Text style={styles.sectionTitleSmall}>Today</Text>
            <View style={styles.todayCard}>
              <View style={styles.todayItem}>
                <Text style={styles.todayValue}>{dashboard?.today?.new_users || 0}</Text>
                <Text style={styles.todayLabel}>New Users</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayItem}>
                <Text style={styles.todayValue}>{dashboard?.today?.scans || 0}</Text>
                <Text style={styles.todayLabel}>Scans</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayItem}>
                <Text style={styles.todayValue}>{dashboard?.today?.valid_scans || 0}</Text>
                <Text style={styles.todayLabel}>Valid</Text>
              </View>
            </View>
          </>
        ) : (
          renderTableView()
        )}

        {/* Quick Actions - Card Grid */}
        <Text style={styles.sectionTitleSmall}>Manage</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuCard} onPress={() => router.push(item.route as any)}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="fade" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country</Text>
            {countries.length === 0 ? (
              <Text style={styles.emptyText}>No countries configured</Text>
            ) : (
              countries.map((country) => (
                <TouchableOpacity
                  key={country.id}
                  style={[styles.countryOption, activeCountry?.id === country.id && styles.countryOptionActive]}
                  onPress={() => handleCountryChange(country.id)}
                >
                  <Text style={styles.countryOptionCode}>{country.code}</Text>
                  <Text style={styles.countryOptionName}>{country.name}</Text>
                  {activeCountry?.id === country.id && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16,
  },
  greeting: { fontSize: 13, color: '#6B7280' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  countryBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  logoutBtn: { padding: 8 },
  
  scrollContent: { padding: 24 },
  
  countryBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 24, gap: 12 },
  countryFlag: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  countryFlagText: { color: '#2563EB', fontWeight: '700', fontSize: 14 },
  countryInfo: { flex: 1 },
  countryName: { color: '#111827', fontWeight: '600', fontSize: 15 },
  countryCurrency: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitleSmall: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 16, marginTop: 24, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  viewToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 2 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 4 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  toggleText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  toggleTextActive: { color: '#fff' },
  
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16,
  },
  statCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20,
    width: isWeb ? 'calc(25% - 12px)' as any : '47%' as any,
    minWidth: isWeb ? 200 : undefined,
  },
  statIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 32, fontWeight: '700', color: '#111827' },
  statTitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  
  tableContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  tableCell: {},
  tableIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tableCellText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  tableCellValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tableCellChange: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  statusBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  
  todayCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, flexDirection: 'row' },
  todayItem: { flex: 1, alignItems: 'center' },
  todayValue: { fontSize: 28, fontWeight: '700', color: '#2563EB' },
  todayLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  todayDivider: { width: 1, backgroundColor: '#E5E7EB' },
  
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16,
  },
  menuCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center',
    width: isWeb ? 160 : '30%' as any,
    minWidth: isWeb ? 160 : 100,
  },
  menuIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#111827', textAlign: 'center' },
  menuDesc: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  emptyText: { color: '#6B7280', textAlign: 'center', paddingVertical: 20 },
  countryOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  countryOptionActive: { backgroundColor: '#EFF6FF' },
  countryOptionCode: { width: 36, fontSize: 13, fontWeight: '600', color: '#2563EB' },
  countryOptionName: { flex: 1, fontSize: 15, color: '#111827' },
});
