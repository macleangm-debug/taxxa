import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAdminStore } from '../store/adminStore';

const isWeb = Platform.OS === 'web';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', route: '/admin/dashboard' },
  { id: 'users', label: 'Users', icon: 'people-outline', route: '/admin/users' },
  { id: 'draws', label: 'Draws', icon: 'trophy-outline', route: '/admin/draws' },
  { id: 'scans', label: 'Scans', icon: 'scan-outline', route: '/admin/scans' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: '/admin/notifications' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-outline', route: '/admin/analytics' },
  { id: 'fraud', label: 'Fraud Detection', icon: 'shield-outline', route: '/admin/fraud' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline', route: '/admin/settings' },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, activeCountry } = useAdminStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const isActive = (route: string) => pathname === route;

  return (
    <View style={styles.container}>
      {/* Logo/Brand */}
      <View style={styles.brand}>
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={28} color="#fff" />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.brandTitle}>TaxDraw</Text>
          <Text style={styles.brandSubtitle}>Admin Portal</Text>
        </View>
      </View>

      {/* Country Indicator */}
      {activeCountry && (
        <View style={styles.countryBadge}>
          <Ionicons name="globe" size={14} color="#64748B" />
          <Text style={styles.countryText}>{activeCountry.name}</Text>
        </View>
      )}

      {/* Navigation */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        <Text style={styles.navSection}>MAIN MENU</Text>
        {menuItems.slice(0, 6).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.navItem, isActive(item.route) && styles.navItemActive]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.navIconContainer, isActive(item.route) && styles.navIconContainerActive]}>
              <Ionicons
                name={isActive(item.route) ? item.icon.replace('-outline', '') as any : item.icon as any}
                size={20}
                color={isActive(item.route) ? '#2563EB' : '#64748B'}
              />
            </View>
            <Text style={[styles.navLabel, isActive(item.route) && styles.navLabelActive]}>
              {item.label}
            </Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.navSection}>SYSTEM</Text>
        {menuItems.slice(6).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.navItem, isActive(item.route) && styles.navItemActive]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.navIconContainer, isActive(item.route) && styles.navIconContainerActive]}>
              <Ionicons
                name={isActive(item.route) ? item.icon.replace('-outline', '') as any : item.icon as any}
                size={20}
                color={isActive(item.route) ? '#2563EB' : '#64748B'}
              />
            </View>
            <Text style={[styles.navLabel, isActive(item.route) && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    height: '100%',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    marginLeft: 12,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  countryText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  nav: {
    flex: 1,
    paddingTop: 8,
  },
  navSection: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  navIconContainerActive: {
    backgroundColor: '#DBEAFE',
  },
  navLabel: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 12,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
