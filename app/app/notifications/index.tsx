import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { Icon } from '@/components/ui/Icon';

export default function NotificationsScreen() {
  const { user } = useAuth();

  const notifications = [
    { id: 1, title: 'Leave Approved', message: 'Your annual leave request has been approved', time: '2 hours ago', read: false },
    { id: 2, title: 'Payslip Ready', message: 'Your payslip for December is now available', time: '1 day ago', read: true },
    { id: 3, title: 'Attendance Alert', message: 'You checked in late today', time: '2 days ago', read: true },
    { id: 4, title: 'System Update', message: 'HR system maintenance scheduled for Saturday', time: '3 days ago', read: true },
    { id: 5, title: 'Contract Ready', message: 'Your employment contract is ready for signing', time: '1 week ago', read: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notificationsList}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.read && styles.unreadNotification,
            ]}
          >
            <View style={styles.notificationIcon}>
              <Icon 
                name={notification.read ? 'notifications' : 'notifications-active'} 
                size={24} 
                color={notification.read ? '#9CA3AF' : '#1E40AF'} 
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[
                styles.notificationTitle,
                !notification.read && styles.unreadTitle,
              ]}>
                {notification.title}
              </Text>
              <Text style={styles.notificationMessage}>
                {notification.message}
              </Text>
              <Text style={styles.notificationTime}>
                {notification.time}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadNotification: {
    backgroundColor: '#EFF6FF',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#1E40AF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
