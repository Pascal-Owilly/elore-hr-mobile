// components/attendance/AttendanceCalendar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';

export interface AttendanceCalendarProps {
  markedDates?: {
    [date: string]: {
      selected?: boolean;
      marked?: boolean;
      selectedColor?: string;
      dotColor?: string;
      customStyles?: any;
    };
  };
  onDayPress?: (date: any) => void;
  selectedDate?: string;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  markedDates = {},
  onDayPress,
  selectedDate,
}) => {
  const { colors, isDark } = useTheme();

  // Default theme for calendar
  const calendarTheme = {
    backgroundColor: colors.card,
    calendarBackground: colors.card,
    textSectionTitleColor: colors.textSecondary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: colors.white,
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: colors.border,
    dotColor: colors.primary,
    selectedDotColor: colors.white,
    arrowColor: colors.primary,
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontWeight: '400',
    textMonthFontWeight: '600',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 14,
  };

  // Add today to marked dates if not present
  const today = new Date().toISOString().split('T')[0];
  const finalMarkedDates = {
    ...markedDates,
    [today]: {
      ...markedDates[today],
      customStyles: {
        container: {
          backgroundColor: colors.primary + '20',
          borderRadius: Layout.borderRadius.md,
        },
        text: {
          color: colors.primary,
          fontWeight: 'bold',
        },
      },
    },
  };

  if (selectedDate) {
    finalMarkedDates[selectedDate] = {
      ...finalMarkedDates[selectedDate],
      selected: true,
      selectedColor: colors.primary,
    };
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Calendar
        theme={calendarTheme}
        markedDates={finalMarkedDates}
        onDayPress={onDayPress}
        hideExtraDays
        firstDay={1}
        enableSwipeMonths
        style={styles.calendar}
      />
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Present
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Absent
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Late
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Holiday
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.sm,
  },
  calendar: {
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Layout.spacing.xs,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});