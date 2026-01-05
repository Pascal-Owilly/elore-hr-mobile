
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface Activity {
  id: string;
  type: 'check_in' | 'check_out' | 'leave_request' | 'payroll' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface RecentActivityProps {
  activities?: Activity[];
  maxItems?: number;
}

export default function RecentActivity({ 
  activities = [],  // Default to empty array
  maxItems = 5 
}: RecentActivityProps) {
  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : [];
  const displayedActivities = safeActivities.slice(0, maxItems);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'check_in':
        return 'login';
      case 'check_out':
        return 'logout';
      case 'leave_request':
        return 'beach_access';
      case 'payroll':
        return 'attach_money';
      case 'announcement':
        return 'campaign';
      default:
        return 'notifications';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'check_in':
        return Colors.success500;
      case 'check_out':
        return Colors.warning500;
      case 'leave_request':
        return Colors.info500;
      case 'payroll':
        return Colors.gold500;
      case 'announcement':
        return Colors.primaryBlue500;
      default:
        return Colors.gray500;
    }
  };

  if (safeActivities.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.white }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Icon name="notifications-off" size={48} color={Colors.gray400} />
          <Text style={styles.emptyStateText}>No recent activity</Text>
          <Text style={styles.emptyStateSubtext}>
            Your activity will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.white }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <Link href="/activities" asChild>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.activitiesList}>
        {displayedActivities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.activityItem}
            onPress={() => console.log('Activity pressed:', activity.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
              <Icon 
                name={getActivityIcon(activity.type)} 
                size={20} 
                color={getActivityColor(activity.type)} 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primaryBlue600,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyStateText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textTertiary,
    marginTop: Layout.spacing.xs,
  },
  activitiesList: {
    gap: Layout.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityTimestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textTertiary,
  },
});
