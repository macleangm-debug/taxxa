import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AuthorityAdminPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [authority, setAuthority] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [draws, setDraws] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('authority_admin_token');
      const savedAuthority = await AsyncStorage.getItem('authority_info');
      if (savedToken && savedAuthority) {
        setToken(savedToken);
        setAuthority(JSON.parse(savedAuthority));
        setIsAuthenticated(true);
        await loadDashboard(savedToken);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const response = await fetch(`${API_URL}/api/authority/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      await AsyncStorage.setItem('authority_admin_token', data.access_token);
      await AsyncStorage.setItem('authority_info', JSON.stringify(data.authority));
      setToken(data.access_token);
      setAuthority(data.authority);
      setIsAuthenticated(true);
      await loadDashboard(data.access_token);
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authority_admin_token');
    await AsyncStorage.removeItem('authority_info');
    setIsAuthenticated(false);
    setToken('');
    setAuthority(null);
    setDashboardData(null);
  };

  const loadDashboard = async (authToken: string) => {
    try {
      // Load general admin dashboard (this uses the existing admin endpoint but scoped)
      const dashRes = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardData(data);
      }
      
      // Load draws
      const drawsRes = await fetch(`${API_URL}/api/draws/active`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (drawsRes.ok) {
        const data = await drawsRes.json();
        setDraws(data.draws || []);
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!authority) return amount.toLocaleString();
    return `${authority.currency_symbol} ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.loginHeader}>
            <Ionicons name="business" size={48} color="#10B981" />
            <Text style={styles.loginTitle}>Tax Authority Portal</Text>
            <Text style={styles.loginSubtitle}>Administration Dashboard</Text>
          </View>
          
          <View style={styles.loginForm}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@authority.gov"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry
            />
            
            {loginError ? (
              <Text style={styles.errorText}>{loginError}</Text>
            ) : null}
            
            <TouchableOpacity
              style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.loginFooter}>
            Powered by TAXXA Platform
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
        <View style={styles.sidebarHeader}>
          {authority && (
            <>
              <Image
                source={{ uri: `https://flagcdn.com/w80/${authority.country_code?.toLowerCase() || 'tz'}.png` }}
                style={styles.authorityFlag}
              />
              <Text style={styles.authorityName}>{authority.name}</Text>
              <Text style={styles.authorityCode}>{authority.code}</Text>
            </>
          )}
        </View>
        
        <View style={styles.navItems}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'dashboard' && styles.navItemActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Ionicons name="grid" size={20} color={activeTab === 'dashboard' ? '#10B981' : '#64748B'} />
            {!isMobile && <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>Dashboard</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'users' && styles.navItemActive]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'users' ? '#10B981' : '#64748B'} />
            {!isMobile && <Text style={[styles.navText, activeTab === 'users' && styles.navTextActive]}>Users</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'draws' && styles.navItemActive]}
            onPress={() => setActiveTab('draws')}
          >
            <Ionicons name="trophy" size={20} color={activeTab === 'draws' ? '#10B981' : '#64748B'} />
            {!isMobile && <Text style={[styles.navText, activeTab === 'draws' && styles.navTextActive]}>Draws</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'reports' && styles.navItemActive]}
            onPress={() => setActiveTab('reports')}
          >
            <Ionicons name="bar-chart" size={20} color={activeTab === 'reports' ? '#10B981' : '#64748B'} />
            {!isMobile && <Text style={[styles.navText, activeTab === 'reports' && styles.navTextActive]}>Reports</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Ionicons name="settings" size={20} color={activeTab === 'settings' ? '#10B981' : '#64748B'} />
            {!isMobile && <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Settings</Text>}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          {!isMobile && <Text style={styles.logoutText}>Logout</Text>}
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'draws' && 'Draw Management'}
              {activeTab === 'reports' && 'Reports & Analytics'}
              {activeTab === 'settings' && 'Settings'}
            </Text>
            <Text style={styles.headerSubtitle}>{authority?.country}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadDashboard(token)}>
            <Ionicons name="refresh" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <View style={styles.dashboardContent}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardGreen]}>
                <Ionicons name="people" size={28} color="#10B981" />
                <Text style={styles.statValue}>{dashboardData.total_users?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={styles.statChange}>+{dashboardData.users_today || 0} today</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardBlue]}>
                <Ionicons name="scan" size={28} color="#3B82F6" />
                <Text style={styles.statValue}>{dashboardData.total_scans?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
                <Text style={styles.statChange}>+{dashboardData.scans_today || 0} today</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardPurple]}>
                <Ionicons name="checkmark-circle" size={28} color="#8B5CF6" />
                <Text style={styles.statValue}>{dashboardData.valid_scans?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Valid Scans</Text>
                <Text style={styles.statChange}>{dashboardData.scan_rate ? `${dashboardData.scan_rate}%` : '100%'} rate</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardOrange]}>
                <Ionicons name="trophy" size={28} color="#F59E0B" />
                <Text style={styles.statValue}>{dashboardData.active_draws || 0}</Text>
                <Text style={styles.statLabel}>Active Draws</Text>
                <Text style={styles.statChange}>{dashboardData.completed_draws || 0} completed</Text>
              </View>
            </View>
            
            {/* Chart Area */}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Scan Activity (Last 7 Days)</Text>
              <View style={styles.chartPlaceholder}>
                {dashboardData.scans_by_day?.map((day: any, index: number) => (
                  <View key={index} style={styles.chartBar}>
                    <View 
                      style={[
                        styles.chartBarFill, 
                        { height: `${Math.min((day.count / Math.max(...dashboardData.scans_by_day.map((d: any) => d.count || 1))) * 100, 100)}%` }
                      ]} 
                    />
                    <Text style={styles.chartBarLabel}>{day.day}</Text>
                  </View>
                )) || (
                  <Text style={styles.noDataText}>No scan data available</Text>
                )}
              </View>
            </View>
            
            {/* Active Draws */}
            <View style={styles.drawsSection}>
              <Text style={styles.sectionTitle}>Active Draws</Text>
              {draws.length > 0 ? draws.map((draw, index) => (
                <View key={index} style={styles.drawCard}>
                  <View style={styles.drawInfo}>
                    <Text style={styles.drawName}>{draw.name}</Text>
                    <Text style={styles.drawType}>{draw.type} Draw</Text>
                  </View>
                  <View style={styles.drawStats}>
                    <Text style={styles.drawPrize}>{formatCurrency(draw.prize_amount || 0)}</Text>
                    <Text style={styles.drawEntries}>{draw.total_entries?.toLocaleString() || 0} entries</Text>
                  </View>
                  <View style={[styles.drawStatus, draw.status === 'active' ? styles.drawStatusActive : styles.drawStatusPending]}>
                    <Text style={styles.drawStatusText}>{draw.status}</Text>
                  </View>
                </View>
              )) : (
                <Text style={styles.noDataText}>No active draws</Text>
              )}
            </View>
          </View>
        )}
        
        {/* Users Tab */}
        {activeTab === 'users' && (
          <View style={styles.usersContent}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by phone or name..."
              />
            </View>
            
            <View style={styles.usersList}>
              <Text style={styles.infoText}>
                User management features allow you to view registered users, 
                their scan history, and entry counts.
              </Text>
              
              <View style={styles.userStatsCards}>
                <View style={styles.userStatCard}>
                  <Text style={styles.userStatValue}>{dashboardData?.total_users || 0}</Text>
                  <Text style={styles.userStatLabel}>Total Users</Text>
                </View>
                <View style={styles.userStatCard}>
                  <Text style={styles.userStatValue}>{dashboardData?.users_today || 0}</Text>
                  <Text style={styles.userStatLabel}>New Today</Text>
                </View>
                <View style={styles.userStatCard}>
                  <Text style={styles.userStatValue}>{dashboardData?.users_this_week || 0}</Text>
                  <Text style={styles.userStatLabel}>This Week</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Draws Tab */}
        {activeTab === 'draws' && (
          <View style={styles.drawsContent}>
            <TouchableOpacity style={styles.createDrawButton}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createDrawButtonText}>Create New Draw</Text>
            </TouchableOpacity>
            
            <View style={styles.drawsList}>
              {draws.map((draw, index) => (
                <View key={index} style={styles.drawListCard}>
                  <View style={styles.drawListHeader}>
                    <Text style={styles.drawListName}>{draw.name}</Text>
                    <View style={[styles.drawListStatus, draw.status === 'active' ? styles.drawStatusActive : styles.drawStatusPending]}>
                      <Text style={styles.drawStatusText}>{draw.status}</Text>
                    </View>
                  </View>
                  <View style={styles.drawListDetails}>
                    <Text style={styles.drawListDetail}>Type: {draw.type}</Text>
                    <Text style={styles.drawListDetail}>Prize: {formatCurrency(draw.prize_amount || 0)}</Text>
                    <Text style={styles.drawListDetail}>Entries: {draw.total_entries?.toLocaleString() || 0}</Text>
                    <Text style={styles.drawListDetail}>Draw Date: {new Date(draw.draw_date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.drawListActions}>
                    <TouchableOpacity style={styles.drawAction}>
                      <Text style={styles.drawActionText}>View Details</Text>
                    </TouchableOpacity>
                    {draw.status === 'active' && (
                      <TouchableOpacity style={[styles.drawAction, styles.drawActionPrimary]}>
                        <Text style={styles.drawActionTextPrimary}>Execute Draw</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <View style={styles.reportsContent}>
            <Text style={styles.sectionTitle}>Available Reports</Text>
            
            <View style={styles.reportsList}>
              <TouchableOpacity style={styles.reportCard}>
                <Ionicons name="document-text" size={32} color="#3B82F6" />
                <Text style={styles.reportName}>Daily Activity Report</Text>
                <Text style={styles.reportDesc}>User registrations, scans, and entries</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reportCard}>
                <Ionicons name="pie-chart" size={32} color="#10B981" />
                <Text style={styles.reportName}>Compliance Report</Text>
                <Text style={styles.reportDesc}>Receipt validation statistics</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reportCard}>
                <Ionicons name="trophy" size={32} color="#F59E0B" />
                <Text style={styles.reportName}>Draw Summary Report</Text>
                <Text style={styles.reportDesc}>Winners and prize distributions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reportCard}>
                <Ionicons name="trending-up" size={32} color="#8B5CF6" />
                <Text style={styles.reportName}>Growth Analytics</Text>
                <Text style={styles.reportDesc}>User acquisition and engagement trends</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <View style={styles.settingsContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Authority Information</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Authority Name</Text>
                <Text style={styles.settingValue}>{authority?.name}</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Code</Text>
                <Text style={styles.settingValue}>{authority?.code}</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Country</Text>
                <Text style={styles.settingValue}>{authority?.country}</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Currency</Text>
                <Text style={styles.settingValue}>{authority?.currency} ({authority?.currency_symbol})</Text>
              </View>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Draw Settings</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Weekly Draw Day</Text>
                <Text style={styles.settingValue}>Sunday</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Monthly Draw Day</Text>
                <Text style={styles.settingValue}>Last Sunday of Month</Text>
              </View>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>SMS Notifications</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F1F5F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingText: { marginTop: 16, color: '#64748B', fontSize: 16 },
  
  // Login styles
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#064E3B', padding: 20 },
  loginCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, ...Platform.select({ web: { boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }, default: { elevation: 10 } }) },
  loginHeader: { alignItems: 'center', marginBottom: 32 },
  loginTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginTop: 16 },
  loginSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  loginForm: { gap: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#F9FAFB' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  loginButton: { backgroundColor: '#10B981', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginFooter: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 24 },
  
  // Sidebar styles
  sidebar: { width: 220, backgroundColor: '#064E3B', padding: 16 },
  sidebarMobile: { width: 60, padding: 8 },
  sidebarHeader: { alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  authorityFlag: { width: 48, height: 32, borderRadius: 4, marginBottom: 8 },
  authorityName: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
  authorityCode: { fontSize: 12, color: '#A7F3D0', marginTop: 2 },
  navItems: { flex: 1, gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, gap: 12 },
  navItemActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  navText: { color: '#A7F3D0', fontSize: 14, fontWeight: '500' },
  navTextActive: { color: '#10B981' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  logoutText: { color: '#FCA5A5', fontSize: 14, fontWeight: '500' },
  
  // Main content styles
  mainContent: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  refreshButton: { padding: 8 },
  
  // Dashboard styles
  dashboardContent: { gap: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: { flex: 1, minWidth: 180, padding: 20, borderRadius: 12, backgroundColor: '#fff', ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  statCardGreen: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
  statCardBlue: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  statCardPurple: { borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  statCardOrange: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statChange: { fontSize: 12, color: '#10B981', marginTop: 4 },
  
  chartSection: { backgroundColor: '#fff', padding: 20, borderRadius: 12, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  chartPlaceholder: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, paddingTop: 20 },
  chartBar: { alignItems: 'center', width: 40 },
  chartBarFill: { width: 24, backgroundColor: '#10B981', borderRadius: 4, minHeight: 4 },
  chartBarLabel: { fontSize: 10, color: '#64748B', marginTop: 4 },
  
  drawsSection: { backgroundColor: '#fff', padding: 20, borderRadius: 12, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  drawCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  drawInfo: { flex: 1 },
  drawName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  drawType: { fontSize: 12, color: '#64748B' },
  drawStats: { alignItems: 'flex-end', marginRight: 12 },
  drawPrize: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  drawEntries: { fontSize: 12, color: '#64748B' },
  drawStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  drawStatusActive: { backgroundColor: '#DCFCE7' },
  drawStatusPending: { backgroundColor: '#FEF3C7' },
  drawStatusText: { fontSize: 11, fontWeight: '600', color: '#166534' },
  
  noDataText: { fontSize: 14, color: '#64748B', textAlign: 'center', padding: 20 },
  
  // Users tab
  usersContent: { gap: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, gap: 8, ...Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }, default: { elevation: 1 } }) },
  searchInput: { flex: 1, fontSize: 14 },
  usersList: { gap: 12 },
  infoText: { fontSize: 14, color: '#64748B', backgroundColor: '#fff', padding: 16, borderRadius: 8 },
  userStatsCards: { flexDirection: 'row', gap: 12 },
  userStatCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 8, alignItems: 'center', ...Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }, default: { elevation: 1 } }) },
  userStatValue: { fontSize: 24, fontWeight: '700', color: '#10B981' },
  userStatLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  
  // Draws tab
  drawsContent: { gap: 16 },
  createDrawButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignSelf: 'flex-start' },
  createDrawButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  drawsList: { gap: 12 },
  drawListCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  drawListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  drawListName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  drawListStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  drawListDetails: { gap: 4, marginBottom: 12 },
  drawListDetail: { fontSize: 13, color: '#64748B' },
  drawListActions: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  drawAction: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  drawActionPrimary: { backgroundColor: '#10B981', borderColor: '#10B981' },
  drawActionText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  drawActionTextPrimary: { fontSize: 13, fontWeight: '500', color: '#fff' },
  
  // Reports tab
  reportsContent: { gap: 16 },
  reportsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  reportCard: { width: '48%', minWidth: 200, backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  reportName: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginTop: 12, textAlign: 'center' },
  reportDesc: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  
  // Settings tab
  settingsContent: { gap: 20 },
  settingsSection: { backgroundColor: '#fff', padding: 20, borderRadius: 12, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingLabel: { fontSize: 14, color: '#64748B' },
  settingValue: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
});
