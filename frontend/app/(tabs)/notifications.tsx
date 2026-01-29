import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../src/context/NotificationContext';
import { useAuthStore } from '../../src/store/authStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://tax-compliance-11.preview.emergentagent.com';

export default function NotificationsSettings() {
  const router = useRouter();
  const { token, logout } = useAuthStore();
  const { 
    expoPushToken, 
    notificationPermission, 
    requestPermissions,
    isInitialized 
  } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    draw_reminders: true,
    winner_announcements: true,
    scan_reminders: true,
    promotional: false,
  });

  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await fetch(
        `${API_URL}/api/notifications/settings?${key}=${value}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      // Revert on error
      setSettings(settings);
    }
  };

  const handleEnableNotifications = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Web Notifications',
        'Push notifications work best on mobile devices. Please use the Expo Go app for the full experience.'
      );
      return;
    }
    
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Notifications enabled! You\'ll receive alerts about draws and prizes.');
    } else {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive draw alerts.'
      );
    }
  };

  const isNotificationsEnabled = notificationPermission === 'granted';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[
          styles.statusCard,
          isNotificationsEnabled ? styles.statusEnabled : styles.statusDisabled
        ]}>
          <View style={styles.statusIconContainer}>
            <Ionicons 
              name={isNotificationsEnabled ? "notifications" : "notifications-off"} 
              size={32} 
              color={isNotificationsEnabled ? "#10B981" : "#EF4444"} 
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {isNotificationsEnabled ? "Notifications Enabled" : "Notifications Disabled"}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isNotificationsEnabled 
                ? "You'll receive important updates about draws and prizes"
                : "Enable notifications to never miss a draw"
              }
            </Text>
          </View>
          {!isNotificationsEnabled && (
            <TouchableOpacity 
              style={styles.enableBtn}
              onPress={handleEnableNotifications}
            >
              <Text style={styles.enableBtnText}>Enable</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Draw Reminders</Text>
                <Text style={styles.settingDescription}>Get notified 1 hour before draws</Text>
              </View>
            </View>
            <Switch
              value={settings.draw_reminders}
              onValueChange={(value) => updateSetting('draw_reminders', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={settings.draw_reminders ? '#fff' : '#9CA3AF'}
              disabled={!isNotificationsEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Winner Announcements</Text>
                <Text style={styles.settingDescription}>Be notified instantly when you win</Text>
              </View>
            </View>
            <Switch
              value={settings.winner_announcements}
              onValueChange={(value) => updateSetting('winner_announcements', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={settings.winner_announcements ? '#fff' : '#9CA3AF'}
              disabled={!isNotificationsEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="scan" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Scan Reminders</Text>
                <Text style={styles.settingDescription}>Weekly reminders to scan receipts</Text>
              </View>
            </View>
            <Switch
              value={settings.scan_reminders}
              onValueChange={(value) => updateSetting('scan_reminders', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={settings.scan_reminders ? '#fff' : '#9CA3AF'}
              disabled={!isNotificationsEnabled}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="megaphone" size={20} color="#EC4899" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Promotions & News</Text>
                <Text style={styles.settingDescription}>Special offers and updates</Text>
              </View>
            </View>
            <Switch
              value={settings.promotional}
              onValueChange={(value) => updateSetting('promotional', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={settings.promotional ? '#fff' : '#9CA3AF'}
              disabled={!isNotificationsEnabled}
            />
          </View>
        </View>

        {/* Push Token Info (for debugging) */}
        {__DEV__ && expoPushToken && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Info</Text>
            <View style={styles.debugCard}>
              <Text style={styles.debugLabel}>Push Token:</Text>
              <Text style={styles.debugValue} selectable numberOfLines={2}>
                {expoPushToken}
              </Text>
            </View>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Ionicons name="information-circle" size={20} color="#64748B" />
          <Text style={styles.helpText}>
            Push notifications require the Expo Go app on your mobile device. 
            Web notifications have limited functionality.
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusEnabled: {
    backgroundColor: '#064E3B',
  },
  statusDisabled: {
    backgroundColor: '#7F1D1D',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  enableBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  enableBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  debugCard: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
  },
  debugLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
    gap: 10,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
