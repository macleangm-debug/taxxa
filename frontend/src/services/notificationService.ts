import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://winnerscan.preview.emergentagent.com';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'draw_reminder' | 'winner_announcement' | 'scan_reminder' | 'prize_claim' | 'general';
  drawId?: string;
  prizeAmount?: number;
  message?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notifications and get push token
   */
  async initialize(): Promise<string | null> {
    try {
      // Check if we're on a physical device (required for push notifications)
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission for notifications not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'taxdraw', // Your Expo project ID
      });
      
      this.expoPushToken = tokenData.data;
      console.log('Expo Push Token:', this.expoPushToken);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'TaxDraw Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        });

        await Notifications.setNotificationChannelAsync('draws', {
          name: 'Draw Alerts',
          description: 'Notifications about upcoming and completed draws',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });

        await Notifications.setNotificationChannelAsync('winners', {
          name: 'Winner Announcements',
          description: 'Notifications when you win a prize',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 200, 500],
          lightColor: '#F59E0B',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerToken(userToken: string): Promise<boolean> {
    if (!this.expoPushToken) {
      console.log('No push token available');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          push_token: this.expoPushToken,
          platform: Platform.OS,
          device_name: Device.deviceName || 'Unknown Device',
        }),
      });

      if (response.ok) {
        await AsyncStorage.setItem('push_token_registered', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        badge: 1,
      },
      trigger: trigger || null, // null = immediate
    });

    return notificationId;
  }

  /**
   * Schedule draw reminder notification
   */
  async scheduleDrawReminder(drawId: string, drawDate: Date, drawType: string): Promise<string | null> {
    const now = new Date();
    const reminderTime = new Date(drawDate.getTime() - 60 * 60 * 1000); // 1 hour before

    if (reminderTime <= now) {
      return null; // Too late to schedule
    }

    const notificationId = await this.scheduleLocalNotification(
      '🎰 Draw Starting Soon!',
      `The ${drawType} draw starts in 1 hour! Make sure you have your entries ready.`,
      {
        type: 'draw_reminder',
        drawId,
      },
      {
        date: reminderTime,
      }
    );

    // Store scheduled notification ID
    const scheduledNotifications = await this.getScheduledNotifications();
    scheduledNotifications[drawId] = notificationId;
    await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(scheduledNotifications));

    return notificationId;
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Record<string, string>> {
    const stored = await AsyncStorage.getItem('scheduled_notifications');
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('scheduled_notifications');
  }

  /**
   * Show immediate winner notification
   */
  async showWinnerNotification(prizeName: string, prizeAmount: number, currencySymbol: string): Promise<void> {
    await this.scheduleLocalNotification(
      '🎉 Congratulations! You Won!',
      `You won ${prizeName} - ${currencySymbol} ${prizeAmount.toLocaleString()}! Tap to claim your prize.`,
      {
        type: 'winner_announcement',
        prizeAmount,
      }
    );
  }

  /**
   * Show scan reminder notification
   */
  async showScanReminder(): Promise<void> {
    await this.scheduleLocalNotification(
      '📱 Don\'t Forget to Scan!',
      'Scan your tax receipts today to earn more draw entries. Every receipt counts!',
      {
        type: 'scan_reminder',
      }
    );
  }

  /**
   * Add notification response listener
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
