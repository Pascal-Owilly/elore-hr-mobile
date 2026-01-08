import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Icon } from '@/components/ui/Icon';
import { Alert } from 'react-native';

const THEME_COLORS = {
  cream: '#e9ded3',
  primaryBlue: '#0056b3',
  gold: '#deab63',
  white: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  borderLight: '#e5e7eb',
  background: '#f9fafb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
};

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  recipient: string;
  data?: Record<string, any>;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications
  const { 
    data: notifications, 
    isLoading, 
    error,
    refetch: refetchNotifications 
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications/notifications/');
      return response.data.results || response.data || [];
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/notifications/notifications/mark_all_read/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Alert.alert('Success', 'All notifications marked as read');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to mark notifications as read');
    }
  });

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/notifications/notifications/${notificationId}/`, {
        is_read: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Failed to mark notification as read:', error);
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/notifications/${notificationId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Alert.alert('Success', 'Notification deleted');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete notification');
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All', 
          onPress: () => markAllAsReadMutation.mutate()
        }
      ]
    );
  };

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleDeleteNotification = (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNotificationMutation.mutate(notification.id)
        }
      ]
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return notificationDate.toLocaleDateString('en-GB');
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const type = notification.notification_type?.toLowerCase();
    
    switch (type) {
      case 'leave':
        return 'calendar-check';
      case 'payroll':
      case 'payslip':
        return 'credit-card';
      case 'attendance':
        return 'clock';
      case 'contract':
        return 'file-text';
      case 'announcement':
        return 'megaphone';
      case 'warning':
        return 'alert-triangle';
      case 'success':
        return 'check-circle';
      case 'info':
        return 'info';
      default:
        return 'bell';
    }
  };

  const getNotificationIconColor = (notification: Notification) => {
    const type = notification.notification_type?.toLowerCase();
    
    if (!notification.is_read) {
      return THEME_COLORS.primaryBlue;
    }
    
    switch (type) {
      case 'leave':
      case 'success':
        return THEME_COLORS.success;
      case 'warning':
        return THEME_COLORS.warning;
      case 'error':
      case 'danger':
        return THEME_COLORS.danger;
      case 'info':
      case 'announcement':
        return THEME_COLORS.info;
      default:
        return notification.is_read ? THEME_COLORS.textTertiary : THEME_COLORS.primaryBlue;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={THEME_COLORS.danger} />
        <Text style={styles.errorTitle}>Failed to load notifications</Text>
        <Text style={styles.errorText}>
          {error.message || 'Please check your connection and try again'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchNotifications()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unreadCount = notifications?.filter((n: Notification) => !n.is_read).length || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {notifications && notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
          >
            {markAllAsReadMutation.isPending ? (
              <ActivityIndicator size="small" color={THEME_COLORS.primaryBlue} />
            ) : (
              <Text style={[
                styles.clearButtonText,
                unreadCount === 0 && styles.clearButtonDisabled
              ]}>
                Mark all as read
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView 
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[THEME_COLORS.primaryBlue]}
            tintColor={THEME_COLORS.primaryBlue}
          />
        }
      >
        {notifications && notifications.length > 0 ? (
          notifications.map((notification: Notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.is_read && styles.unreadNotification,
              ]}
              onPress={() => handleMarkAsRead(notification)}
              onLongPress={() => handleDeleteNotification(notification)}
            >
              <View style={styles.notificationIcon}>
                <Icon 
                  name={getNotificationIcon(notification)}
                  size={24}
                  color={getNotificationIconColor(notification)}
                />
                {!notification.is_read && (
                  <View style={styles.unreadBadge} />
                )}
              </View>
              
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.is_read && styles.unreadTitle,
                  ]}>
                    {notification.title}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => handleDeleteNotification(notification)}
                    style={styles.deleteButton}
                  >
                    <Icon name="x" size={16} color={THEME_COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                
                <View style={styles.notificationFooter}>
                  <Text style={styles.notificationTime}>
                    {formatTimeAgo(notification.created_at)}
                  </Text>
                  
                  {notification.notification_type && (
                    <View style={[
                      styles.notificationType,
                      { backgroundColor: `${getNotificationIconColor(notification)}20` }
                    ]}>
                      <Text style={[
                        styles.notificationTypeText,
                        { color: getNotificationIconColor(notification) }
                      ]}>
                        {notification.notification_type}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="bell-off" size={48} color={THEME_COLORS.textTertiary} />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! No notifications at the moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.background,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: THEME_COLORS.primaryBlue,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: THEME_COLORS.primaryBlue,
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: THEME_COLORS.gray100,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: THEME_COLORS.primaryBlue,
    fontWeight: '500',
  },
  clearButtonDisabled: {
    color: THEME_COLORS.textTertiary,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: THEME_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.gray100,
  },
  unreadNotification: {
    backgroundColor: THEME_COLORS.primaryBlue + '08',
  },
  notificationIcon: {
    marginRight: 12,
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLORS.primaryBlue,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textSecondary,
    flex: 1,
  },
  unreadTitle: {
    color: THEME_COLORS.textPrimary,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: THEME_COLORS.textTertiary,
  },
  notificationType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  notificationTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});