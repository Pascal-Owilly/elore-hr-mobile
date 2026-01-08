// app/app/leaves/calendar.tsx - FIXED VERSION
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Layout } from '@/constants/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { leaveApi } from '@/lib/api/client';

// Define types for TypeScript
interface LeaveData {
  date: string;
  leaves: Array<{
    employee: string;
    leave_type: string;
  }>;
}

interface CalendarResponse {
  calendar: LeaveData[];
  summary: {
    total_leaves: number;
    employees_on_leave: number;
  };
}

interface Holiday {
  date: string;
  name: string;
}

// Helper functions
const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

const generateCalendar = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const calendar = [];
  let currentWeek = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    currentWeek.push({
      date: currentDate.toISOString().split('T')[0],
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
      isCurrentMonth: currentDate.getMonth() === month,
    });
    
    if (currentDate.getDay() === 6) {
      calendar.push(currentWeek);
      currentWeek = [];
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return calendar;
};

const getLeaveColor = (leaveType: string): string => {
  const colors: Record<string, string> = {
    'ANNUAL': '#3b82f6',
    'SICK': '#10b981',
    'MATERNITY': '#8b5cf6',
    'PATERNITY': '#f59e0b',
    'STUDY': '#ef4444',
    'COMPASSIONATE': '#6b7280',
    'UNPAID': '#9ca3af',
    'annual': '#3b82f6',
    'sick': '#10b981',
    'maternity': '#8b5cf6',
    'paternity': '#f59e0b',
    'casual': '#ef4444',
  };
  
  return colors[leaveType] || '#6b7280';
};

function LeaveCalendarScreen() {
  const router = useRouter();
  const { employee } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Fetch leave calendar data
  const { data: calendarData, isLoading, error, refetch } = useQuery<CalendarResponse>({
    queryKey: ['leaveCalendar', employee?.organization?.id, currentMonth, currentYear],
    queryFn: async () => {
      if (!employee?.organization?.id) {
        throw new Error('Organization ID not found');
      }

      const response = await leaveApi.getLeaveCalendar({
        month: currentMonth + 1,
        year: currentYear,
        organization_id: employee.organization.id,
      });
      return response.data;
    },
    enabled: !!employee?.organization?.id,
  });

  // Fetch public holidays
  const { data: holidays } = useQuery<Holiday[]>({
    queryKey: ['publicHolidays', employee?.organization?.id, currentYear],
    queryFn: async () => {
      if (!employee?.organization?.id) {
        throw new Error('Organization ID not found');
      }

      const response = await leaveApi.getPublicHolidays({
        organization: employee.organization.id,
        year: currentYear,
      });
      return response.data?.results || [];
    },
    enabled: !!employee?.organization?.id,
  });

  const calendarDays = useMemo(() => {
    return generateCalendar(currentDate);
  }, [currentDate]);

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayLeaves = (date: string) => {
    return calendarData?.calendar?.find((day: LeaveData) => day.date === date)?.leaves || [];
  };

  const getDayHolidays = (date: string) => {
    return holidays?.filter((holiday: Holiday) => holiday.date === date) || [];
  };

  // Simple colors since we removed useTheme hook
  const colors = {
    background: '#f8f9fa',
    card: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    primary: '#3b82f6',
    error: '#ef4444',
    border: '#e5e7eb',
    white: '#ffffff',
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading calendar...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle" type="feather" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Failed to load calendar
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.retryButtonText, { color: colors.white }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Calendar Header */}
      <View style={[styles.calendarHeader, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={goToPrevious}>
          <Icon name="chevron-left" type="feather" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.dateControls}>
          <Text style={[styles.currentMonth, { color: colors.text }]}>
            {getMonthName(currentMonth)} {currentYear}
          </Text>
          <Button
            title="Today"
            size="small"
            variant="outline"
            onPress={goToToday}
          />
        </View>
        
        <TouchableOpacity onPress={goToNext}>
          <Icon name="chevron-right" type="feather" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={[styles.viewModeToggle, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'month' && [styles.toggleButtonActive, { backgroundColor: colors.primary }],
          ]}
          onPress={() => setViewMode('month')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: colors.textSecondary },
              viewMode === 'month' && [styles.toggleTextActive, { color: colors.white }],
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'week' && [styles.toggleButtonActive, { backgroundColor: colors.primary }],
          ]}
          onPress={() => setViewMode('week')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: colors.textSecondary },
              viewMode === 'week' && [styles.toggleTextActive, { color: colors.white }],
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={[styles.weekdays, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekday}>
            <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const dayLeaves = getDayLeaves(day.date);
              const dayHolidays = getDayHolidays(day.date);
              const isToday = day.date === new Date().toISOString().split('T')[0];
              const isWeekend = day.dayOfWeek === 'Saturday' || day.dayOfWeek === 'Sunday';

              return (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.dayCell,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isToday && [styles.todayCell, { borderColor: colors.primary }],
                    isWeekend && styles.weekendCell,
                    !day.isCurrentMonth && styles.otherMonthCell,
                  ]}
                  onPress={() => {
                    // Using navigate instead of router.push to avoid circular dependencies
                    router.navigate(`/app/leaves/apply?date=${day.date}`);
                  }}
                >
                  <View style={styles.dayHeader}>
                    <Text style={[
                      styles.dayNumber,
                      { color: colors.text },
                      isToday && [styles.todayNumber, { color: colors.primary }],
                      isWeekend && styles.weekendNumber,
                      !day.isCurrentMonth && styles.otherMonthText,
                    ]}>
                      {day.day}
                    </Text>
                    {dayHolidays.length > 0 && (
                      <Icon name="flag" type="feather" size={12} color="#f59e0b" />
                    )}
                  </View>

                  {/* Leaves */}
                  {dayLeaves.slice(0, 2).map((leave: any, index: number) => (
                    <View 
                      key={index} 
                      style={[styles.leaveBadge, { backgroundColor: getLeaveColor(leave.leave_type) }]}
                    >
                      <Text style={styles.leaveBadgeText} numberOfLines={1}>
                        {leave.employee?.split(' ')[0] || 'Employee'}
                      </Text>
                    </View>
                  ))}

                  {/* More indicator */}
                  {dayLeaves.length > 2 && (
                    <Text style={[styles.moreIndicator, { color: colors.textSecondary }]}>
                      +{dayLeaves.length - 2} more
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <Card style={styles.legendCard}>
        <Text style={[styles.legendTitle, { color: colors.text }]}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Annual Leave</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Sick Leave</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#8b5cf6' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Maternity</Text>
          </View>
          <View style={styles.legendItem}>
            <Icon name="flag" type="feather" size={12} color="#f59e0b" />
            <Text style={[styles.legendText, { color: colors.text }]}>Public Holiday</Text>
          </View>
        </View>
      </Card>

      {/* Quick Stats */}
      <Card style={styles.statsCard}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Month Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {calendarData?.summary?.total_leaves || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Leaves
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {calendarData?.summary?.employees_on_leave || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Employees
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {holidays?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Holidays
            </Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          title="Apply for Leave"
          onPress={() => router.navigate('/app/leaves/apply')}
          style={styles.applyButton}
        />
        <Button
          title="View My Leaves"
          variant="outline"
          onPress={() => router.navigate('/app/leaves/requests')}
        />
      </View>

      {/* Footer Spacer */}
      <View style={styles.footerSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  errorText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    marginBottom: Layout.spacing.md,
  },
  retryButton: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateControls: {
    alignItems: 'center',
  },
  currentMonth: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  viewModeToggle: {
    flexDirection: 'row',
    margin: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderRadius: Layout.borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  weekdays: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.sm,
  },
  weekday: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
    backgroundColor: '#ffffff',
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRightWidth: 1,
    padding: 4,
  },
  todayCell: {
    borderWidth: 2,
  },
  weekendCell: {
    backgroundColor: '#f9fafb',
  },
  otherMonthCell: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  todayNumber: {
    fontWeight: 'bold',
  },
  weekendNumber: {
    color: '#6b7280',
  },
  otherMonthText: {
    color: '#9ca3af',
  },
  leaveBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  leaveBadgeText: {
    fontSize: 9,
    color: '#ffffff',
    textAlign: 'center',
  },
  moreIndicator: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  legendCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.md,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  statsCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActions: {
    marginHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  applyButton: {
    backgroundColor: '#0056b3',
  },
  footerSpacer: {
    height: Layout.spacing.xl,
  },
});

export default LeaveCalendarScreen;