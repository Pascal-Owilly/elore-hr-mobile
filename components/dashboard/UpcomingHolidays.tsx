// components/dashboard/UpcomingHolidays.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'public' | 'company' | 'regional';
  description?: string;
  isAnnual: boolean;
}

export interface UpcomingHolidaysProps {
  holidays?: Holiday[];
  onHolidayPress?: (holiday: Holiday) => void;
  onViewCalendar?: () => void;
  title?: string;
}

export const UpcomingHolidays: React.FC<UpcomingHolidaysProps> = ({
  holidays,
  onHolidayPress,
  onViewCalendar,
  title = 'Upcoming Holidays',
}) => {
  const { colors } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const holidayDate = new Date(dateString);
    const diffTime = holidayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Passed';
    return `In ${diffDays} days`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public':
        return colors.primary;
      case 'company':
        return colors.success;
      case 'regional':
        return colors.secondary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {onViewCalendar && (
          <TouchableOpacity onPress={onViewCalendar}>
            <Text style={[styles.viewCalendar, { color: colors.primary }]}>
              Calendar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {holidays.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="calendar"
            type="feather"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No upcoming holidays
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.holidaysList}>
          {holidays.map((holiday) => {
            const typeColor = getTypeColor(holiday.type);
            const daysUntil = getDaysUntil(holiday.date);

            return (
              <TouchableOpacity
                key={holiday.id}
                style={styles.holidayItem}
                onPress={() => onHolidayPress?.(holiday)}
                activeOpacity={0.7}
              >
                <View style={styles.holidayDateContainer}>
                  <View style={[styles.dateBox, { backgroundColor: typeColor + '20' }]}>
                    <Text style={[styles.dateDay, { color: typeColor }]}>
                      {new Date(holiday.date).getDate()}
                    </Text>
                    <Text style={[styles.dateMonth, { color: typeColor }]}>
                      {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </View>
                </View>

                <View style={styles.holidayInfo}>
                  <View style={styles.holidayHeader}>
                    <Text style={[styles.holidayName, { color: colors.text }]}>
                      {holiday.name}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                      <Text style={[styles.typeText, { color: typeColor }]}>
                        {holiday.type}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.holidayDescription, { color: colors.textSecondary }]}>
                    {holiday.description || 'Public holiday'}
                  </Text>
                  
                  <View style={styles.holidayFooter}>
                    <View style={styles.daysUntilContainer}>
                      <Icon
                        name="clock"
                        type="feather"
                        size={12}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.daysUntil, { color: colors.textSecondary }]}>
                        {daysUntil}
                      </Text>
                    </View>
                    <Text style={[styles.fullDate, { color: colors.textSecondary }]}>
                      {formatDate(holiday.date)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewCalendar: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Layout.spacing.md,
  },
  holidaysList: {
    maxHeight: 300,
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  holidayDateContainer: {
    marginRight: Layout.spacing.md,
  },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  holidayName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  holidayDescription: {
    fontSize: 12,
    marginBottom: Layout.spacing.xs,
  },
  holidayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysUntilContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysUntil: {
    fontSize: 11,
    marginLeft: 4,
  },
  fullDate: {
    fontSize: 11,
  },
});