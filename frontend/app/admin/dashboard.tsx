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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../src/store/adminStore';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width > 768;

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
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const MenuCard = ({ title, icon, color, route, count, description }: any) => (
    <TouchableOpacity
      style={styles.menuCard}
      onPress={() => router.push(route)}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={28} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>TaxDraw Management System</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Main Content Container */}
        <View style={styles.mainContainer}>
          {/* Left Column - Stats */}
          <View style={styles.leftColumn}>
            {/* Overview Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platform Overview</Text>
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
                  subtitle={`${dashboard?.overview?.success_rate || 0}% success rate`}
                />
                <StatCard
                  title="Valid Scans"
                  value={dashboard?.overview?.valid_scans || 0}
                  icon="checkmark-circle"
                  color="#10B981"
                />
                <StatCard
                  title="Invalid Scans"
                  value={dashboard?.overview?.invalid_scans || 0}
                  icon="close-circle"
                  color="#EF4444"
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
              </View>
            </View>

            {/* Today's Activity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Activity</Text>
              <View style={styles.activityCard}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIconBg, { backgroundColor: '#3B82F620' }]}>
                    <Ionicons name="person-add" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityValue}>{dashboard?.today?.new_users || 0}</Text>
                    <Text style={styles.activityLabel}>New Users</Text>
                  </View>
                </View>
                <View style={styles.activityDivider} />
                <View style={styles.activityItem}>
                  <View style={[styles.activityIconBg, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="scan" size={20} color="#10B981" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityValue}>{dashboard?.today?.scans || 0}</Text>
                    <Text style={styles.activityLabel}>Scans</Text>
                  </View>
                </View>
                <View style={styles.activityDivider} />
                <View style={styles.activityItem}>
                  <View style={[styles.activityIconBg, { backgroundColor: '#F59E0B20' }]}>
                    <Ionicons name="checkmark-done" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityValue}>{dashboard?.today?.valid_scans || 0}</Text>
                    <Text style={styles.activityLabel}>Valid</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Weekly Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <View style={styles.weeklyCard}>
                <View style={styles.weeklyItem}>
                  <Text style={styles.weeklyValue}>{dashboard?.this_week?.new_users || 0}</Text>
                  <Text style={styles.weeklyLabel}>New Users</Text>
                </View>
                <View style={styles.weeklyItem}>
                  <Text style={styles.weeklyValue}>{dashboard?.this_week?.scans || 0}</Text>
                  <Text style={styles.weeklyLabel}>Total Scans</Text>
                </View>
                <View style={styles.weeklyItem}>
                  <Text style={styles.weeklyValue}>{dashboard?.overview?.total_entries || 0}</Text>
                  <Text style={styles.weeklyLabel}>Draw Entries</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column - Quick Actions */}
          <View style={styles.rightColumn}>
            {/* Fraud Alerts */}
            {(dashboard?.fraud_alerts?.flagged_users > 0 || dashboard?.fraud_alerts?.blocked_users > 0) && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => router.push('/admin/fraud')}
              >
                <View style={styles.alertIcon}>
                  <Ionicons name="warning" size={24} color="#EF4444" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Fraud Alerts</Text>
                  <Text style={styles.alertText}>
                    {dashboard?.fraud_alerts?.flagged_users || 0} flagged users, {dashboard?.fraud_alerts?.blocked_users || 0} blocked
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
              </TouchableOpacity>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.menuList}>
                <MenuCard
                  title="User Management"
                  icon="people"
                  color="#3B82F6"
                  route="/admin/users"
                  count={dashboard?.overview?.total_users}
                  description="View and manage all users"
                />
                <MenuCard
                  title="Draw Management"
                  icon="trophy"
                  color="#F59E0B"
                  route="/admin/draws"
                  count={dashboard?.overview?.active_draws}
                  description="Create and manage prize draws"
                />
                <MenuCard
                  title="Scan Records"
                  icon="scan"
                  color="#10B981"
                  route="/admin/scans"
                  description="View all receipt scans"
                />
                <MenuCard
                  title="Analytics"
                  icon="bar-chart"
                  color="#8B5CF6"
                  route="/admin/analytics"
                  description="View platform analytics"
                />
                <MenuCard
                  title="Fraud Detection"
                  icon="shield"
                  color="#EF4444"
                  route="/admin/fraud"
                  description="Monitor suspicious activity"
                />
                <MenuCard
                  title="Settings"
                  icon="settings"
                  color="#64748B"
                  route="/admin/settings"
                  description="Manage countries and platform settings"
                />
              </View>
            </View>
          </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '500',
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  mainContainer: {
    flexDirection: Platform.OS === 'web' && width > 1024 ? 'row' : 'column',
    gap: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  leftColumn: {
    flex: Platform.OS === 'web' && width > 1024 ? 2 : 1,
    gap: 24,
  },
  rightColumn: {
    flex: 1,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: Platform.OS === 'web' && width > 768 ? 'calc(50% - 6px)' : '100%',
    minWidth: 200,
    flex: Platform.OS === 'web' ? undefined : 1,
    flexBasis: Platform.OS === 'web' && width > 768 ? '48%' : '100%',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  activityItem: {
    alignItems: 'center',
    gap: 10,
  },
  activityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  activityLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  activityDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#334155',
  },
  weeklyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyItem: {
    alignItems: 'center',
  },
  weeklyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  weeklyLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#7F1D1D',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  alertText: {
    fontSize: 13,
    color: '#FECACA',
    marginTop: 2,
  },
  menuList: {
    gap: 10,
  },
  menuCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  menuDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
