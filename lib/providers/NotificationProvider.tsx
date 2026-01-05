import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform, Alert, ToastAndroid } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '@lib/hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  timestamp: Date;
  type?: 'info' | 'warning' | 'success' | 'error';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  showToast: (message: string, duration?: number) => void;
  showAlert: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      read: false,
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50 notifications

    // Show platform-specific notification
    if (Platform.OS === 'android') {
      ToastAndroid.show(notification.title, ToastAndroid.SHORT);
    }
    
    // Play sound or vibration if needed
    // You can add haptic feedback here if you have react-native-haptic-feedback
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const showToast = (message: string, duration: number = ToastAndroid.SHORT) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, duration);
    } else if (Platform.OS === 'ios') {
      // For iOS, you might want to use a different approach
      Alert.alert('Notification', message);
    } else {
      console.log('Toast:', message);
    }
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  // Initialize with welcome notification
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        addNotification({
          title: 'Welcome to HR System!',
          body: 'You have successfully logged in to your dashboard.',
          type: 'success',
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showToast,
    showAlert,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};