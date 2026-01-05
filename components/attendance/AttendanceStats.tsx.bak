// components/attendance/AttendanceStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export interface AttendanceStatsProps {
  stats?: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    holiday: number;
    totalWorkingDays: number;
    attendancePercentage: number;
  };
}

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({ stats }) => {
  const { colors } = useTheme();

  const defaultStats = {
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    holiday: 0,
    totalWorkingDays: 0,
    attendancePercentage: 0,
    ...stats,
  };

  const statItems = [
    {
      label: 'Present',
      value: defaultStats.present,
      color: colors.success,
      icon: 'check-circle',
      iconType: 'feather' as const,
    },
    {
      label: 'Absent',
      value: defaultStats.absent,
      color: colors.error,
      icon: 'x-circle',
      iconType: 'feather' as const,
    },
    {
      label: 'Late',
      value: defaultStats.late,
      color: colors.warning,
      icon: 'clock',
      iconType: 'feather' as const,
    },
    {
      label: 'Half Day',
      value: defaultStats.halfDay,
      color: colors.info,
      icon: 'sun',
      iconType: 'feather' as const,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Monthly Stats
        </Text>
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentage, { color: colors.primary }]}>
            {defaultStats.attendancePercentage.toFixed(1)}%
          </Text>
          <Text style={[styles.percentageLabel, { color: colors.textSecondary }]}>
            Attendance
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Icon
                name={item.icon}
                type={item.iconType}
                size={20}
                color={item.color}
              />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {item.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Total Working Days
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]}>
            {defaultStats.totalWorkingDays}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
            Holidays
          </Text>
          <Text style={[styles.footerValue, { color: colors.text }]}>
            {defaultStats.holiday}
          </Text>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  percentageLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerItem: {
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  footerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});