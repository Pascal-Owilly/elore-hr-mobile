// components/attendance/RecentAttendance.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export interface AttendanceRecord {
  id: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  totalHours?: string;
  overtime?: string;
}

export interface RecentAttendanceProps {
  records?: AttendanceRecord[];
  onRecordPress?: (record: AttendanceRecord) => void;
  isLoading?: boolean;
}

export const RecentAttendance: React.FC<RecentAttendanceProps> = ({
  records = [] = [],
  onRecordPress,
  isLoading = false,
}) => {
  const { colors } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return colors.success;
      case 'absent':
        return colors.error;
      case 'late':
        return colors.warning;
      case 'half-day':
        return colors.info;
      case 'holiday':
        return colors.secondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return { name: 'check-circle', type: 'feather' as const };
      case 'absent':
        return { name: 'x-circle', type: 'feather' as const };
      case 'late':
        return { name: 'clock', type: 'feather' as const };
      case 'half-day':
        return { name: 'sun', type: 'feather' as const };
      case 'holiday':
        return { name: 'umbrella-beach', type: 'material-community' as const };
      default:
        return { name: 'circle', type: 'feather' as const };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading attendance records...
        </Text>
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.emptyContainer}>
          <Icon
            name="calendar"
            type="feather"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No attendance records found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Your recent attendance will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recent Attendance
        </Text>
        <TouchableOpacity>
          <Text style={[styles.viewAll, { color: colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {records.map((record, index) => {
          const statusColor = getStatusColor(record.status);
          const statusIcon = getStatusIcon(record.status);

          return (
            <TouchableOpacity
              key={record.id || index}
              style={[styles.recordCard, { backgroundColor: colors.background }]}
              onPress={() => onRecordPress?.(record)}
            >
              <View style={styles.recordHeader}>
                <Text style={[styles.date, { color: colors.text }]}>
                  {formatDate(record.date)}
                </Text>
                <Text style={[styles.day, { color: colors.textSecondary }]}>
                  {record.day}
                </Text>
              </View>

              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Icon
                    name={statusIcon.name}
                    type={statusIcon.type}
                    size={12}
                    color={statusColor}
                  />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.timeContainer}>
                <View style={styles.timeItem}>
                  <Icon name="log-in" type="feather" size={14} color={colors.textSecondary} />
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                    In
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {record.checkIn || '--:--'}
                  </Text>
                </View>

                <View style={styles.timeItem}>
                  <Icon name="log-out" type="feather" size={14} color={colors.textSecondary} />
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                    Out
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.text }]}>
                    {record.checkOut || '--:--'}
                  </Text>
                </View>
              </View>

              {record.totalHours && (
                <View style={styles.hoursContainer}>
                  <Text style={[styles.hoursLabel, { color: colors.textSecondary }]}>
                    Total Hours
                  </Text>
                  <Text style={[styles.hoursValue, { color: colors.text }]}>
                    {record.totalHours}h
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.sm,
  },
  loadingText: {
    textAlign: 'center',
    padding: Layout.spacing.xl,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingRight: Layout.spacing.md,
  },
  recordCard: {
    width: 160,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginRight: Layout.spacing.md,
    ...Layout.shadow.xs,
  },
  recordHeader: {
    marginBottom: Layout.spacing.sm,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  day: {
    fontSize: 12,
    opacity: 0.8,
  },
  statusContainer: {
    marginBottom: Layout.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.round,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  timeContainer: {
    marginBottom: Layout.spacing.sm,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 10,
    marginLeft: 4,
    marginRight: 8,
    width: 20,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  hoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  hoursLabel: {
    fontSize: 10,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});