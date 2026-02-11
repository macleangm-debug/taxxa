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

export default function SuperAdminPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<any>(null);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newAuthority, setNewAuthority] = useState({
    name: '',
    code: '',
    country: '',
    country_code: '',
    admin_email: '',
    admin_password: '',
    currency: '',
    currency_symbol: '',
    timezone: '',
    efd_system: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('super_admin_token');
      if (savedToken) {
        setToken(savedToken);
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
      const response = await fetch(`${API_URL}/api/super-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      await AsyncStorage.setItem('super_admin_token', data.access_token);
      setToken(data.access_token);
      setIsAuthenticated(true);
      await loadDashboard(data.access_token);
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('super_admin_token');
    setIsAuthenticated(false);
    setToken('');
    setDashboardData(null);
  };

  const loadDashboard = async (authToken: string) => {
    try {
      const [dashRes, authRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/super-admin/consolidated-dashboard`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        }),
        fetch(`${API_URL}/api/super-admin/tax-authorities`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        }),
        fetch(`${API_URL}/api/super-admin/audit-logs?limit=50`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        }),
      ]);
      
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboardData(dashData);
      }
      
      if (authRes.ok) {
        const authData = await authRes.json();
        setAuthorities(authData.authorities || []);
      }
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs || []);
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  const createAuthority = async () => {
    try {
      const response = await fetch(`${API_URL}/api/super-admin/tax-authorities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newAuthority),
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewAuthority({
          name: '', code: '', country: '', country_code: '',
          admin_email: '', admin_password: '', currency: '',
          currency_symbol: '', timezone: '', efd_system: '',
        });
        await loadDashboard(token);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to create authority');
      }
    } catch (error) {
      alert('Failed to create authority');
    }
  };

  const viewAuthorityDetails = async (code: string) => {
    try {
      const response = await fetch(`${API_URL}/api/super-admin/tax-authorities/${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedAuthority(data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching authority details:', error);
    }
  };

  const toggleAuthorityStatus = async (code: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/super-admin/tax-authorities/${code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      
      if (response.ok) {
        await loadDashboard(token);
      }
    } catch (error) {
      console.error('Error toggling authority status:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginLogo}>TAXXA</Text>
            <Text style={styles.loginSubtitle}>Super Admin Portal</Text>
          </View>
          
          <View style={styles.loginForm}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@taxxa.io"
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
            TAXXA Platform Administration
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
          <Text style={styles.sidebarLogo}>TAXXA</Text>
          <Text style={styles.sidebarRole}>Super Admin</Text>
        </View>
        
        <View style={styles.navItems}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'dashboard' && styles.navItemActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Ionicons name="grid" size={20} color={activeTab === 'dashboard' ? '#3B82F6' : '#64748B'} />
            <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'authorities' && styles.navItemActive]}
            onPress={() => setActiveTab('authorities')}
          >
            <Ionicons name="business" size={20} color={activeTab === 'authorities' ? '#3B82F6' : '#64748B'} />
            <Text style={[styles.navText, activeTab === 'authorities' && styles.navTextActive]}>Tax Authorities</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'audit' && styles.navItemActive]}
            onPress={() => setActiveTab('audit')}
          >
            <Ionicons name="document-text" size={20} color={activeTab === 'audit' ? '#3B82F6' : '#64748B'} />
            <Text style={[styles.navText, activeTab === 'audit' && styles.navTextActive]}>Audit Logs</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'dashboard' && 'Consolidated Dashboard'}
            {activeTab === 'authorities' && 'Tax Authorities'}
            {activeTab === 'audit' && 'Audit Logs'}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadDashboard(token)}>
            <Ionicons name="refresh" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <View style={styles.dashboardContent}>
            {/* Global Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="business" size={32} color="#3B82F6" />
                <Text style={styles.statValue}>{dashboardData.global_stats.total_authorities}</Text>
                <Text style={styles.statLabel}>Tax Authorities</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="people" size={32} color="#22C55E" />
                <Text style={styles.statValue}>{dashboardData.global_stats.total_users.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="scan" size={32} color="#F59E0B" />
                <Text style={styles.statValue}>{dashboardData.global_stats.total_scans.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="trophy" size={32} color="#8B5CF6" />
                <Text style={styles.statValue}>{dashboardData.global_stats.total_draws}</Text>
                <Text style={styles.statLabel}>Total Draws</Text>
              </View>
            </View>
            
            {/* Today's Stats */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Today's Activity</Text>
              <View style={styles.todayStats}>
                <View style={styles.todayStat}>
                  <Text style={styles.todayValue}>{dashboardData.today.new_users}</Text>
                  <Text style={styles.todayLabel}>New Users</Text>
                </View>
                <View style={styles.todayStat}>
                  <Text style={styles.todayValue}>{dashboardData.today.scans}</Text>
                  <Text style={styles.todayLabel}>Scans</Text>
                </View>
              </View>
            </View>
            
            {/* By Authority */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>By Authority</Text>
              {dashboardData.by_authority.map((auth: any, index: number) => (
                <View key={index} style={styles.authorityRow}>
                  <View style={styles.authorityInfo}>
                    <Image
                      source={{ uri: `https://flagcdn.com/w40/${auth.country_code.toLowerCase()}.png` }}
                      style={styles.flagIcon}
                    />
                    <View>
                      <Text style={styles.authorityName}>{auth.name}</Text>
                      <Text style={styles.authorityCountry}>{auth.country}</Text>
                    </View>
                  </View>
                  <View style={styles.authorityStats}>
                    <View style={styles.authorityStat}>
                      <Text style={styles.authorityStatValue}>{auth.users.toLocaleString()}</Text>
                      <Text style={styles.authorityStatLabel}>Users</Text>
                    </View>
                    <View style={styles.authorityStat}>
                      <Text style={styles.authorityStatValue}>{auth.scans.toLocaleString()}</Text>
                      <Text style={styles.authorityStatLabel}>Scans</Text>
                    </View>
                    <View style={styles.authorityStat}>
                      <Text style={styles.authorityStatValue}>{auth.scans_today}</Text>
                      <Text style={styles.authorityStatLabel}>Today</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Authorities Tab */}
        {activeTab === 'authorities' && (
          <View style={styles.authoritiesContent}>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Tax Authority</Text>
            </TouchableOpacity>
            
            <View style={styles.authoritiesList}>
              {authorities.map((auth, index) => (
                <View key={index} style={styles.authorityCard}>
                  <View style={styles.authorityCardHeader}>
                    <Image
                      source={{ uri: `https://flagcdn.com/w80/${auth.country_code.toLowerCase()}.png` }}
                      style={styles.authorityFlag}
                    />
                    <View style={styles.authorityCardInfo}>
                      <Text style={styles.authorityCardName}>{auth.name}</Text>
                      <Text style={styles.authorityCardCode}>{auth.code} • {auth.country}</Text>
                    </View>
                    <View style={[styles.statusBadge, auth.is_active ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, auth.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
                        {auth.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.authorityCardStats}>
                    <View style={styles.authorityCardStat}>
                      <Ionicons name="people" size={16} color="#64748B" />
                      <Text style={styles.authorityCardStatText}>{auth.stats.users} users</Text>
                    </View>
                    <View style={styles.authorityCardStat}>
                      <Ionicons name="scan" size={16} color="#64748B" />
                      <Text style={styles.authorityCardStatText}>{auth.stats.scans} scans</Text>
                    </View>
                    <View style={styles.authorityCardStat}>
                      <Ionicons name="trophy" size={16} color="#64748B" />
                      <Text style={styles.authorityCardStatText}>{auth.stats.draws} draws</Text>
                    </View>
                  </View>
                  
                  <View style={styles.authorityCardDetails}>
                    <Text style={styles.detailText}>📧 {auth.admin_email}</Text>
                    <Text style={styles.detailText}>💰 {auth.currency} ({auth.currency_symbol})</Text>
                    <Text style={styles.detailText}>🔌 {auth.efd_system || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.authorityCardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => viewAuthorityDetails(auth.code)}
                    >
                      <Text style={styles.actionButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, auth.is_active ? styles.deactivateButton : styles.activateButton]}
                      onPress={() => toggleAuthorityStatus(auth.code, auth.is_active)}
                    >
                      <Text style={[styles.actionButtonText, auth.is_active ? styles.deactivateText : styles.activateText]}>
                        {auth.is_active ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <View style={styles.auditContent}>
            <View style={styles.auditList}>
              {auditLogs.map((log, index) => (
                <View key={index} style={styles.auditItem}>
                  <View style={styles.auditIcon}>
                    <Ionicons
                      name={
                        log.action.includes('created') ? 'add-circle' :
                        log.action.includes('updated') ? 'create' :
                        log.action.includes('deactivated') ? 'close-circle' : 'ellipse'
                      }
                      size={24}
                      color={
                        log.action.includes('created') ? '#22C55E' :
                        log.action.includes('updated') ? '#3B82F6' :
                        log.action.includes('deactivated') ? '#EF4444' : '#64748B'
                      }
                    />
                  </View>
                  <View style={styles.auditDetails}>
                    <Text style={styles.auditAction}>{log.action.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.auditMeta}>
                      {log.authority_code && `${log.authority_code} • `}
                      {log.performed_by}
                    </Text>
                    <Text style={styles.auditTime}>
                      {new Date(log.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Create Authority Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Tax Authority</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Authority Name *</Text>
              <TextInput
                style={styles.input}
                value={newAuthority.name}
                onChangeText={(v) => setNewAuthority({...newAuthority, name: v})}
                placeholder="e.g., Tanzania Revenue Authority"
              />
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={newAuthority.code}
                    onChangeText={(v) => setNewAuthority({...newAuthority, code: v.toUpperCase()})}
                    placeholder="e.g., TRA"
                    maxLength={5}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Country Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={newAuthority.country_code}
                    onChangeText={(v) => setNewAuthority({...newAuthority, country_code: v.toUpperCase()})}
                    placeholder="e.g., TZ"
                    maxLength={2}
                  />
                </View>
              </View>
              
              <Text style={styles.inputLabel}>Country *</Text>
              <TextInput
                style={styles.input}
                value={newAuthority.country}
                onChangeText={(v) => setNewAuthority({...newAuthority, country: v})}
                placeholder="e.g., Tanzania"
              />
              
              <Text style={styles.inputLabel}>Admin Email *</Text>
              <TextInput
                style={styles.input}
                value={newAuthority.admin_email}
                onChangeText={(v) => setNewAuthority({...newAuthority, admin_email: v})}
                placeholder="e.g., admin@tra.go.tz"
                keyboardType="email-address"
              />
              
              <Text style={styles.inputLabel}>Admin Password *</Text>
              <TextInput
                style={styles.input}
                value={newAuthority.admin_password}
                onChangeText={(v) => setNewAuthority({...newAuthority, admin_password: v})}
                placeholder="Enter secure password"
                secureTextEntry
              />
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Currency *</Text>
                  <TextInput
                    style={styles.input}
                    value={newAuthority.currency}
                    onChangeText={(v) => setNewAuthority({...newAuthority, currency: v.toUpperCase()})}
                    placeholder="e.g., TZS"
                    maxLength={3}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Symbol *</Text>
                  <TextInput
                    style={styles.input}
                    value={newAuthority.currency_symbol}
                    onChangeText={(v) => setNewAuthority({...newAuthority, currency_symbol: v})}
                    placeholder="e.g., TSh"
                  />
                </View>
              </View>
              
              <Text style={styles.inputLabel}>Timezone</Text>
              <TextInput
                style={styles.input}
                value={newAuthority.timezone}
                onChangeText={(v) => setNewAuthority({...newAuthority, timezone: v})}
                placeholder="e.g., Africa/Dar_es_Salaam"
              />
              
              <Text style={styles.inputLabel}>EFD System</Text>
              <TextInput
                style={styles.input}
                value={newAuthority.efd_system}
                onChangeText={(v) => setNewAuthority({...newAuthority, efd_system: v})}
                placeholder="e.g., EFDMS, eTIMS, EFRIS"
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={createAuthority}>
                <Text style={styles.submitButtonText}>Create Authority</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Authority Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAuthority?.name}</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {selectedAuthority && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Authority Information</Text>
                  <Text style={styles.detailRow}>Code: {selectedAuthority.code}</Text>
                  <Text style={styles.detailRow}>Country: {selectedAuthority.country}</Text>
                  <Text style={styles.detailRow}>Currency: {selectedAuthority.currency} ({selectedAuthority.currency_symbol})</Text>
                  <Text style={styles.detailRow}>EFD System: {selectedAuthority.efd_system || 'N/A'}</Text>
                  <Text style={styles.detailRow}>Timezone: {selectedAuthority.timezone}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Statistics</Text>
                  <Text style={styles.detailRow}>Total Users: {selectedAuthority.stats?.total_users?.toLocaleString()}</Text>
                  <Text style={styles.detailRow}>Users Today: {selectedAuthority.stats?.users_today}</Text>
                  <Text style={styles.detailRow}>Users This Month: {selectedAuthority.stats?.users_this_month}</Text>
                  <Text style={styles.detailRow}>Total Scans: {selectedAuthority.stats?.total_scans?.toLocaleString()}</Text>
                  <Text style={styles.detailRow}>Valid Scans: {selectedAuthority.stats?.valid_scans?.toLocaleString()}</Text>
                  <Text style={styles.detailRow}>Total Draws: {selectedAuthority.stats?.total_draws}</Text>
                  <Text style={styles.detailRow}>Active Draws: {selectedAuthority.stats?.active_draws}</Text>
                </View>
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.submitButton} onPress={() => setShowDetailModal(false)}>
                <Text style={styles.submitButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F1F5F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingText: { marginTop: 16, color: '#64748B', fontSize: 16 },
  
  // Login styles
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', padding: 20 },
  loginCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, ...Platform.select({ web: { boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }, default: { elevation: 10 } }) },
  loginHeader: { alignItems: 'center', marginBottom: 32 },
  loginLogo: { fontSize: 36, fontWeight: '800', color: '#3B82F6' },
  loginSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  loginForm: { gap: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#F9FAFB' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  loginButton: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginFooter: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 24 },
  
  // Sidebar styles
  sidebar: { width: 240, backgroundColor: '#0F172A', padding: 20 },
  sidebarMobile: { width: 60, padding: 10 },
  sidebarHeader: { marginBottom: 32 },
  sidebarLogo: { fontSize: 24, fontWeight: '800', color: '#3B82F6' },
  sidebarRole: { fontSize: 12, color: '#64748B', marginTop: 4 },
  navItems: { flex: 1, gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, gap: 12 },
  navItemActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  navText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  navTextActive: { color: '#3B82F6' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  logoutText: { color: '#EF4444', fontSize: 14, fontWeight: '500' },
  
  // Main content styles
  mainContent: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  refreshButton: { padding: 8 },
  
  // Dashboard styles
  dashboardContent: { gap: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: { flex: 1, minWidth: 200, padding: 20, borderRadius: 12, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 32, fontWeight: '700', color: '#1E293B' },
  statLabel: { fontSize: 14, color: '#64748B' },
  
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  
  todayStats: { flexDirection: 'row', gap: 32 },
  todayStat: { alignItems: 'center' },
  todayValue: { fontSize: 28, fontWeight: '700', color: '#3B82F6' },
  todayLabel: { fontSize: 14, color: '#64748B' },
  
  authorityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  authorityInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flagIcon: { width: 32, height: 20, borderRadius: 2 },
  authorityName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  authorityCountry: { fontSize: 12, color: '#64748B' },
  authorityStats: { flexDirection: 'row', gap: 24 },
  authorityStat: { alignItems: 'center' },
  authorityStatValue: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  authorityStatLabel: { fontSize: 11, color: '#64748B' },
  
  // Authorities tab styles
  authoritiesContent: { gap: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3B82F6', padding: 12, borderRadius: 8, alignSelf: 'flex-start' },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  authoritiesList: { gap: 16 },
  authorityCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, default: { elevation: 2 } }) },
  authorityCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  authorityFlag: { width: 48, height: 32, borderRadius: 4 },
  authorityCardInfo: { flex: 1 },
  authorityCardName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  authorityCardCode: { fontSize: 12, color: '#64748B' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextActive: { color: '#166534' },
  statusTextInactive: { color: '#991B1B' },
  authorityCardStats: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  authorityCardStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorityCardStatText: { fontSize: 13, color: '#64748B' },
  authorityCardDetails: { gap: 4, marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  detailText: { fontSize: 13, color: '#64748B' },
  authorityCardActions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  deactivateButton: { borderColor: '#FCA5A5' },
  deactivateText: { color: '#EF4444' },
  activateButton: { borderColor: '#86EFAC' },
  activateText: { color: '#22C55E' },
  
  // Audit tab styles
  auditContent: { gap: 16 },
  auditList: { gap: 8 },
  auditItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 8, gap: 12, ...Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }, default: { elevation: 1 } }) },
  auditIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  auditDetails: { flex: 1 },
  auditAction: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  auditMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  auditTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelButtonText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  submitButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#3B82F6' },
  submitButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  
  // Detail modal
  detailSection: { marginBottom: 20 },
  detailSectionTitle: { fontSize: 14, fontWeight: '600', color: '#3B82F6', marginBottom: 8 },
  detailRow: { fontSize: 14, color: '#374151', marginBottom: 4 },
});
