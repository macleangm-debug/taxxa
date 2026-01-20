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

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 1400;

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

  const currencySymbol = activeCountry?.currency_symbol || '$';

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const MenuCard = ({ title, icon, color, route, description }: any) => (
    <TouchableOpacity style={styles.menuCard} onPress={() => router.push(route)}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuDescription}>{description}</Text>
    </TouchableOpacity>
  );

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
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Metric</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Total Value</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Today's Change</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
      </View>
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={[styles.tableIcon, { backgroundColor: '#2563EB15' }]}>
            <Ionicons name="people" size={18} color="#2563EB" />
          </View>
          <Text style={styles.tableCellText}>Total Users</Text>
        </View>
        <Text style={[styles.tableCellValue, { flex: 1.5 }]}>{dashboard?.overview?.total_users || 0}</Text>
        <Text style={[styles.tableCellChange, { flex: 1.5 }]}>+{dashboard?.today?.new_users || 0}</Text>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <View style={styles.statusGood}><Text style={styles.statusText}>Active</Text></View>
        </View>
      </View>
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={[styles.tableIcon, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="scan" size={18} color="#10B981" />
          </View>
          <Text style={styles.tableCellText}>Total Scans</Text>
        </View>
        <Text style={[styles.tableCellValue, { flex: 1.5 }]}>{dashboard?.overview?.total_scans || 0}</Text>
        <Text style={[styles.tableCellChange, { flex: 1.5 }]}>+{dashboard?.today?.scans || 0}</Text>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <View style={styles.statusGood}><Text style={styles.statusText}>Active</Text></View>
        </View>
      </View>
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={[styles.tableIcon, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          </View>
          <Text style={styles.tableCellText}>Valid Scans</Text>
        </View>
        <Text style={[styles.tableCellValue, { flex: 1.5 }]}>{dashboard?.overview?.valid_scans || 0}</Text>
        <Text style={[styles.tableCellChange, { flex: 1.5 }]}>+{dashboard?.today?.valid_scans || 0}</Text>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <View style={styles.statusGood}><Text style={styles.statusText}>Active</Text></View>
        </View>
      </View>
      <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
        <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={[styles.tableIcon, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="trophy" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.tableCellText}>Active Draws</Text>
        </View>
        <Text style={[styles.tableCellValue, { flex: 1.5 }]}>{dashboard?.overview?.active_draws || 0}</Text>
        <Text style={[styles.tableCellChange, { flex: 1.5, color: '#6B7280' }]}>-</Text>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <View style={styles.statusActive}><Text style={styles.statusTextActive}>Running</Text></View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
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
        <View style={styles.contentContainer}>
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
                <StatCard title="Users" value={dashboard?.overview?.total_users || 0} icon="people" color="#2563EB" />
                <StatCard title="Scans" value={dashboard?.overview?.total_scans || 0} icon="scan" color="#10B981" />
                <StatCard title="Valid" value={dashboard?.overview?.valid_scans || 0} icon="checkmark-circle" color="#10B981" />
                <StatCard title="Draws" value={dashboard?.overview?.active_draws || 0} icon="trophy" color="#F59E0B" />
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

          {/* Quick Actions - Grid of Cards */}
          <Text style={styles.sectionTitleSmall}>Manage</Text>
          <View style={styles.menuGrid}>
            <MenuCard title="Users" icon="people" color="#2563EB" route="/admin/users" description="View and manage users" />
            <MenuCard title="Draws" icon="trophy" color="#F59E0B" route="/admin/draws" description="Create and manage draws" />
            <MenuCard title="Scans" icon="scan" color="#10B981" route="/admin/scans" description="View scan records" />
            <MenuCard title="Analytics" icon="bar-chart" color="#8B5CF6" route="/admin/analytics" description="View reports" />
            <MenuCard title="Fraud" icon="shield" color="#EF4444" route="/admin/fraud" description="Monitor suspicious activity" />
            <MenuCard title="Settings" icon="settings" color="#6B7280" route="/admin/settings" description="Platform settings" />
          </View>
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
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, maxWidth: MAX_WIDTH, alignSelf: 'center', width: '100%' },
  greeting: { fontSize: 13, color: '#6B7280' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  countryBtnText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  logoutBtn: { padding: 8 },
  
  scrollContent: { paddingVertical: 24, alignItems: isWeb ? 'center' : undefined },
  contentContainer: { width: '100%', maxWidth: MAX_WIDTH, paddingHorizontal: 24 },
  
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
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, minWidth: 160, flex: 1, flexBasis: isWeb ? 'calc(25% - 12px)' : '45%', maxWidth: isWeb ? 'calc(25% - 12px)' : '48%' },
  statIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 32, fontWeight: '700', color: '#111827' },
  statTitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  
  tableContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableHeaderCell: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  tableCell: { fontSize: 14, color: '#111827' },
  tableIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tableCellText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  tableCellValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tableCellChange: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  statusGood: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  statusTextActive: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  
  todayCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, flexDirection: 'row' },
  todayItem: { flex: 1, alignItems: 'center' },
  todayValue: { fontSize: 28, fontWeight: '700', color: '#2563EB' },
  todayLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  todayDivider: { width: 1, backgroundColor: '#E5E7EB' },
  
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16,
    justifyContent: 'flex-start',
  },
  menuCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center',
    width: isWeb ? 180 : '30%',
    minWidth: isWeb ? 180 : 100,
  },
  menuIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#111827', textAlign: 'center' },
  menuDescription: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  emptyText: { color: '#6B7280', textAlign: 'center', paddingVertical: 20 },
  countryOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  countryOptionActive: { backgroundColor: '#EFF6FF' },
  countryOptionCode: { width: 36, fontSize: 13, fontWeight: '600', color: '#2563EB' },
  countryOptionName: { flex: 1, fontSize: 15, color: '#111827' },
});
