import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';
import { useAdminStore } from '../../src/store/adminStore';
import { format } from 'date-fns';

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  recipients_count: number;
  admin: string;
  timestamp: string;
}

export default function AdminNotifications() {
  const { draws, fetchDraws } = useAdminStore();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  
  // Send notification form
  const [showSendModal, setShowSendModal] = useState(false);
  const [notificationType, setNotificationType] = useState<'general' | 'draw_reminder' | 'winner'>('general');
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchDraws();
  }, []);

  const activeDraws = draws.filter(d => d.status === 'active');
  const completedDraws = draws.filter(d => d.status === 'completed');

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please fill in title and message');
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          body,
          notification_type: notificationType,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', `Notification sent to ${data.sent} devices`);
        setShowSendModal(false);
        setTitle('');
        setBody('');
      } else {
        Alert.alert('Error', data.detail || 'Failed to send notification');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const sendDrawReminder = async (drawId: string) => {
    setIsSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`/api/admin/notifications/draw-reminder/${drawId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', data.message);
      } else {
        Alert.alert('Error', data.detail || 'Failed to send reminder');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send draw reminder');
    } finally {
      setIsSending(false);
    }
  };

  const sendWinnerNotifications = async (drawId: string) => {
    setIsSending(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`/api/admin/notifications/winner/${drawId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', data.message);
      } else {
        Alert.alert('Error', data.detail || 'Failed to send winner notifications');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send winner notifications');
    } finally {
      setIsSending(false);
    }
  };

  const notificationTypes = [
    { id: 'general', label: 'General', icon: 'megaphone', color: '#2563EB' },
    { id: 'draw_reminder', label: 'Draw Reminder', icon: 'calendar', color: '#F59E0B' },
    { id: 'scan_reminder', label: 'Scan Reminder', icon: 'scan', color: '#10B981' },
    { id: 'promotional', label: 'Promotional', icon: 'gift', color: '#EC4899' },
  ];

  return (
    <AdminLayout title="Notifications">
      <AdminHeader title="Push Notifications" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionCards}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowSendModal(true)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="send" size={24} color="#2563EB" />
              </View>
              <Text style={styles.actionTitle}>Send Broadcast</Text>
              <Text style={styles.actionSubtitle}>Send to all users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionCard, styles.actionCardDisabled]}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>Schedule</Text>
              <Text style={styles.actionSubtitle}>Coming soon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Draws - Send Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Draws - Send Reminders</Text>
          {activeDraws.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color="#64748B" />
              <Text style={styles.emptyText}>No active draws</Text>
            </View>
          ) : (
            activeDraws.map((draw) => (
              <View key={draw.id} style={styles.drawItem}>
                <View style={styles.drawInfo}>
                  <View style={styles.drawBadge}>
                    <Text style={styles.drawBadgeText}>
                      {draw.draw_type?.charAt(0).toUpperCase()}{draw.draw_type?.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.drawDate}>
                    Ends: {draw.end_date ? format(new Date(draw.end_date), 'MMM d, yyyy h:mm a') : 'N/A'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.sendBtn}
                  onPress={() => sendDrawReminder(draw.id)}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="notifications" size={16} color="#fff" />
                      <Text style={styles.sendBtnText}>Send Reminder</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Completed Draws - Notify Winners */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Draws - Notify Winners</Text>
          {completedDraws.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={40} color="#64748B" />
              <Text style={styles.emptyText}>No completed draws</Text>
            </View>
          ) : (
            completedDraws.slice(0, 5).map((draw) => (
              <View key={draw.id} style={styles.drawItem}>
                <View style={styles.drawInfo}>
                  <View style={[styles.drawBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.drawBadgeText, { color: '#059669' }]}>
                      {draw.draw_type?.charAt(0).toUpperCase()}{draw.draw_type?.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.drawDate}>
                    {draw.winners?.length || 0} winners
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.sendBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={() => sendWinnerNotifications(draw.id)}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trophy" size={16} color="#fff" />
                      <Text style={styles.sendBtnText}>Notify Winners</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notification Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Registered Devices</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Sent Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Send Notification Modal */}
      <Modal visible={showSendModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Push Notification</Text>
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Notification Type */}
              <Text style={styles.inputLabel}>Notification Type</Text>
              <View style={styles.typeSelector}>
                {notificationTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      notificationType === type.id && styles.typeOptionActive
                    ]}
                    onPress={() => setNotificationType(type.id as any)}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={notificationType === type.id ? '#fff' : type.color} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      notificationType === type.id && styles.typeOptionTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 🎰 Don't Miss Today's Draw!"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />

              {/* Body */}
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your notification message..."
                placeholderTextColor="#64748B"
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={4}
              />

              {/* Preview */}
              <Text style={styles.inputLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewIcon}>
                    <Text style={styles.previewIconText}>TD</Text>
                  </View>
                  <View>
                    <Text style={styles.previewApp}>TaxDraw</Text>
                    <Text style={styles.previewTime}>now</Text>
                  </View>
                </View>
                <Text style={styles.previewTitle}>{title || 'Notification Title'}</Text>
                <Text style={styles.previewBody}>{body || 'Your message will appear here...'}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setShowSendModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitBtn}
                onPress={sendNotification}
                disabled={isSending || !title.trim() || !body.trim()}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Send to All Users</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  actionCards: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  drawItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawInfo: {
    flex: 1,
  },
  drawBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  drawBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  drawDate: {
    fontSize: 13,
    color: '#64748B',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typeOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIconText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  previewApp: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  previewTime: {
    color: '#64748B',
    fontSize: 11,
  },
  previewTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  previewBody: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
