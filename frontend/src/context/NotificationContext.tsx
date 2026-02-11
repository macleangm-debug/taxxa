import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import notificationService, { NotificationData } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';

interface NotificationContextType {
  expoPushToken: string | null;
  isInitialized: boolean;
  notificationPermission: string | null;
  scheduleDrawReminder: (drawId: string, drawDate: Date, drawType: string) => Promise<void>;
  showLocalNotification: (title: string, body: string, data?: NotificationData) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef(AppState.currentState);
  
  const router = useRouter();
  const { token: authToken, isAuthenticated } = useAuthStore();

  // Initialize notifications
  useEffect(() => {
    const initialize = async () => {
      // Skip on web - notifications work differently
      if (Platform.OS === 'web') {
        setIsInitialized(true);
        return;
      }

      try {
        const token = await notificationService.initialize();
        setExpoPushToken(token);
        
        const settings = await notificationService.getSettings();
        setNotificationPermission(settings.status);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setIsInitialized(true);
      }
    };

    initialize();

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Register push token with backend when authenticated
  useEffect(() => {
    if (isAuthenticated && authToken && expoPushToken) {
      notificationService.registerToken(authToken);
    }
  }, [isAuthenticated, authToken, expoPushToken]);

  // Listen for incoming notifications (foreground)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // You can handle foreground notifications here
        // e.g., show an in-app toast
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  // Handle notification taps (opens/interactions)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        console.log('Notification tapped:', data);

        // Navigate based on notification type
        if (data.type === 'draw_reminder' && data.drawId) {
          router.push('/draws');
        } else if (data.type === 'winner_announcement') {
          router.push('/draws');
        } else if (data.type === 'scan_reminder') {
          router.push('/scan');
        }
      }
    );

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  // Handle app state changes (background -> foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - could refresh notification badge, etc.
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const scheduleDrawReminder = async (drawId: string, drawDate: Date, drawType: string) => {
    if (Platform.OS === 'web') return;
    await notificationService.scheduleDrawReminder(drawId, drawDate, drawType);
  };

  const showLocalNotification = async (title: string, body: string, data?: NotificationData) => {
    if (Platform.OS === 'web') return;
    await notificationService.scheduleLocalNotification(title, body, data);
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermission(status);
    
    if (status === 'granted') {
      const token = await notificationService.initialize();
      setExpoPushToken(token);
      return true;
    }
    return false;
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        isInitialized,
        notificationPermission,
        scheduleDrawReminder,
        showLocalNotification,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationProvider;
