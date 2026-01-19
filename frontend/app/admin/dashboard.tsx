import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const { dashboard, fetchDashboard, logout } = useAdminStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await fetchDashboard();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }, [fetchDashboard]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const MenuCard = ({ title, icon, color, route, count }: any) => (
    <TouchableOpacity
      style={styles.menuCard}
      onPress={() => router.push(route)}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      {count !== undefined && (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>TaxDraw Management</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Overview Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={dashboard?.overview?.total_users || 0}
            icon="people"
            color="#3B82F6"
            subtitle={`+${dashboard?.today?.new_users || 0} today`}
          />
          <StatCard
            title="Total Scans"
            value={dashboard?.overview?.total_scans || 0}
            icon="scan"
            color="#10B981"
            subtitle={`${dashboard?.overview?.success_rate || 0}% success`}
          />
          <StatCard
            title="Valid Scans"
            value={dashboard?.overview?.valid_scans || 0}
            icon="checkmark-circle"
            color="#10B981"
          />
          <StatCard
            title="Active Draws"
            value={dashboard?.overview?.active_draws || 0}
            icon="trophy"
            color="#F59E0B"
          />
          <StatCard
            title="Prize Pool"
            value={`$${(dashboard?.overview?.total_prize_pool || 0).toLocaleString()}`}
            icon="cash"
            color="#8B5CF6"
          />
          <StatCard
            title="Total Entries"
            value={dashboard?.overview?.total_entries || 0}
            icon="ticket"
            color="#EC4899"
          />
        </View>

        {/* Today's Activity */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <Text style={styles.activityValue}>{dashboard?.today?.new_users || 0}</Text>
            <Text style={styles.activityLabel}>New Users</Text>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <Text style={styles.activityValue}>{dashboard?.today?.scans || 0}</Text>
            <Text style={styles.activityLabel}>Scans</Text>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <Text style={styles.activityValue}>{dashboard?.today?.valid_scans || 0}</Text>
            <Text style={styles.activityLabel}>Valid</Text>
          </View>
        </View>

        {/* Fraud Alerts */}
        {(dashboard?.fraud_alerts?.flagged_users > 0 || dashboard?.fraud_alerts?.blocked_users > 0) && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => router.push('/admin/fraud')}
          >
            <Ionicons name="warning" size={24} color="#EF4444" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Fraud Alerts</Text>
              <Text style={styles.alertText}>
                {dashboard?.fraud_alerts?.flagged_users || 0} flagged, {dashboard?.fraud_alerts?.blocked_users || 0} blocked
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Quick Menu */}
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuList}>
          <MenuCard
            title="User Management"
            icon="people"
            color="#3B82F6"
            route="/admin/users"
            count={dashboard?.overview?.total_users}
          />
          <MenuCard
            title="Draw Management"
            icon="trophy"
            color="#F59E0B"
            route="/admin/draws"
            count={dashboard?.overview?.active_draws}
          />
          <MenuCard
            title="Scan Records"
            icon="scan"
            color="#10B981"
            route="/admin/scans"
          />
          <MenuCard
            title="Analytics"
            icon="bar-chart"
            color="#8B5CF6"
            route="/admin/analytics"
          />
          <MenuCard
            title="Fraud Detection"
            icon="shield"
            color="#EF4444"
            route="/admin/fraud"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  logoutButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  activityItem: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  activityLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  activityDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  alertCard: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  alertText: {
    fontSize: 14,
    color: '#FECACA',
  },
  menuList: {
    gap: 8,
  },
  menuCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
