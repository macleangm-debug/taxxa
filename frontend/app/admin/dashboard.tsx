import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';
import StatCard from '../../src/components/StatCard';
import ChartCard from '../../src/components/ChartCard';

const isWeb = Platform.OS === 'web';

export default function AdminDashboard() {
  const router = useRouter();
  const { 
    dashboard, 
    fetchDashboard,
    countries,
    activeCountry,
    fetchCountries,
  } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await fetchCountries();
      await fetchDashboard();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
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

  const currencySymbol = activeCountry?.currency_symbol || '$';

  // Generate mock chart data (in production, this would come from the backend)
  const weeklyScans = [
    { label: 'Mon', value: Math.floor(Math.random() * 100) + 20, color: '#2563EB' },
    { label: 'Tue', value: Math.floor(Math.random() * 100) + 20, color: '#2563EB' },
    { label: 'Wed', value: Math.floor(Math.random() * 100) + 20, color: '#2563EB' },
    { label: 'Thu', value: Math.floor(Math.random() * 100) + 20, color: '#2563EB' },
    { label: 'Fri', value: Math.floor(Math.random() * 100) + 20, color: '#2563EB' },
    { label: 'Sat', value: Math.floor(Math.random() * 100) + 20, color: '#2563EB' },
    { label: 'Sun', value: Math.floor(Math.random() * 100) + 20, color: '#2563EB' },
  ];

  const scanBreakdown = [
    { label: 'Valid Scans', value: dashboard?.overview?.valid_scans || 0, color: '#10B981' },
    { label: 'Invalid Scans', value: (dashboard?.overview?.total_scans || 0) - (dashboard?.overview?.valid_scans || 0), color: '#EF4444' },
    { label: 'Duplicate Scans', value: Math.floor((dashboard?.overview?.total_scans || 0) * 0.1), color: '#F59E0B' },
  ];

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
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeTitle}>Welcome back, Admin</Text>
          <Text style={styles.welcomeSubtitle}>Here's what's happening with your platform today.</Text>
        </View>
        <TouchableOpacity style={styles.dateFilter}>
          <Ionicons name="calendar-outline" size={18} color="#64748B" />
          <Text style={styles.dateFilterText}>Last 7 days</Text>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.statsRow}>
        <StatCard
          title="Total Users"
          value={dashboard?.overview?.total_users || 0}
          change="+12.5%"
          changeType="positive"
          icon="people"
          iconColor="#2563EB"
          iconBg="#EFF6FF"
        />
        <StatCard
          title="Total Scans"
          value={dashboard?.overview?.total_scans || 0}
          change="+8.2%"
          changeType="positive"
          icon="scan"
          iconColor="#10B981"
          iconBg="#ECFDF5"
        />
        <StatCard
          title="Valid Scans"
          value={dashboard?.overview?.valid_scans || 0}
          change="+15.3%"
          changeType="positive"
          icon="checkmark-circle"
          iconColor="#8B5CF6"
          iconBg="#F3E8FF"
        />
        <StatCard
          title="Active Draws"
          value={dashboard?.overview?.active_draws || 0}
          change="0"
          changeType="neutral"
          icon="trophy"
          iconColor="#F59E0B"
          iconBg="#FEF3C7"
        />
      </View>

      {/* Charts Row */}
      <View style={styles.chartsRow}>
        <View style={styles.chartLarge}>
          <ChartCard
            title="Scans Overview"
            subtitle="Daily scans for the past week"
            data={weeklyScans}
            type="bar"
          />
        </View>
        <View style={styles.chartSmall}>
          <ChartCard
            title="Scan Breakdown"
            subtitle="By status type"
            data={scanBreakdown}
            type="horizontal"
          />
        </View>
      </View>

      {/* Today's Activity & Quick Stats */}
      <View style={styles.activityRow}>
        {/* Today's Activity */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Today's Activity</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person-add" size={20} color="#2563EB" />
              </View>
              <Text style={styles.activityValue}>{dashboard?.today?.new_users || 0}</Text>
              <Text style={styles.activityLabel}>New Users</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="scan" size={20} color="#10B981" />
              </View>
              <Text style={styles.activityValue}>{dashboard?.today?.scans || 0}</Text>
              <Text style={styles.activityLabel}>Scans</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="checkmark-done" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.activityValue}>{dashboard?.today?.valid_scans || 0}</Text>
              <Text style={styles.activityLabel}>Valid</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="ticket" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.activityValue}>{dashboard?.today?.entries || 0}</Text>
              <Text style={styles.activityLabel}>Entries</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.activityTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/admin/draws')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="add-circle" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>New Draw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/admin/users')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people" size={24} color="#2563EB" />
              </View>
              <Text style={styles.quickActionText}>View Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/admin/analytics')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="stats-chart" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/admin/fraud')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#EF4444" />
              </View>
              <Text style={styles.quickActionText}>Fraud Check</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recent Activity Table */}
      <View style={styles.recentCard}>
        <View style={styles.recentHeader}>
          <Text style={styles.activityTitle}>Platform Status</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllLink}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <View style={styles.statusIconGood}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>API Status</Text>
              <Text style={styles.statusValue}>Operational</Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <View style={styles.statusIconGood}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Database</Text>
              <Text style={styles.statusValue}>Connected</Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <View style={styles.statusIconGood}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Active Draws</Text>
              <Text style={styles.statusValue}>{dashboard?.overview?.active_draws || 0} Running</Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusIconGood, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alert" size={16} color="#F59E0B" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Fraud Alerts</Text>
              <Text style={styles.statusValue}>0 Pending</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="Dashboard" 
        subtitle={activeCountry ? `${activeCountry.name} • ${activeCountry.currency_code}` : 'All Countries'}
      />
      {content}
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
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  dateFilterText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  chartsRow: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 20,
    marginBottom: 24,
  },
  chartLarge: {
    flex: 2,
  },
  chartSmall: {
    flex: 1,
  },
  activityRow: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 20,
    marginBottom: 24,
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityItem: {
    alignItems: 'center',
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  activityLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  quickActionsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  quickAction: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconGood: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {},
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
});
