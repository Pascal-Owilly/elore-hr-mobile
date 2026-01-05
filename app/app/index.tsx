import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAttendance } from '@/lib/hooks/useAttendance';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { KenyaConstants } from '@/constants/KenyaConstants';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity'; // Default import
import { LeaveBalanceCard } from '@/components/dashboard/LeaveBalanceCard';
import { PayrollSummary } from '@/components/dashboard/PayrollSummary';
import { Announcements } from '@/components/dashboard/Announcements';
import { UpcomingHolidays } from '@/components/dashboard/UpcomingHolidays';
import { api } from '@/lib/api/client';
import dayjs from 'dayjs';

export default function DashboardScreen() {
  const { user, employee } = useAuth();
  const { todaysAttendance, checkIn, checkOut } = useAttendance();
  const { unreadCount } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Fetch dashboard data
  const { data: dashboardData, refetch, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/');
      return response.data;
    },
  });

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCheckIn = async () => {
    try {
      await checkIn();
      // Refresh dashboard data
      await refetch();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      await refetch();
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  // Quick actions based on user role
  const quickActions = [
    {
      title: 'Check In',
      icon: 'log-in',
      color: Colors.success500,
      onPress: handleCheckIn,
      disabled: todaysAttendance?.check_in_time,
    },
    {
      title: 'Check Out',
      icon: 'log-out',
      color: Colors.warning500,
      onPress: handleCheckOut,
      disabled: !todaysAttendance?.check_in_time || todaysAttendance?.check_out_time,
    },
    {
      title: 'Apply Leave',
      icon: 'calendar-plus',
      color: Colors.primaryBlue500,
      onPress: () => router.push('/(app)/leaves/apply'),
    },
    {
      title: 'View Payslip',
      icon: 'file-text',
      color: Colors.gold500,
      onPress: () => router.push('/(app)/payroll'),
    },
  ];

  // Admin quick actions
  const adminActions = [
    {
      title: 'Manage Employees',
      icon: 'users',
      color: Colors.primaryBlue500,
      onPress: () => router.push('/(admin)/employees'),
    },
    {
      title: 'Process Payroll',
      icon: 'credit-card',
      color: Colors.gold500,
      onPress: () => router.push('/(admin)/payroll-admin'),
    },
    {
      title: 'Generate Reports',
      icon: 'pie-chart',
      color: Colors.success500,
      onPress: () => router.push('/(admin)/reports'),
    },
    {
      title: 'Approve Requests',
      icon: 'check-circle',
      color: Colors.info500,
      onPress: () => router.push('/(admin)/approvals'),
    },
  ];

  const userActions = user?.role === 'ADMIN' || user?.role === 'HR' ? adminActions : quickActions;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good {getTimeOfDay(currentTime)}, {user?.first_name}
          </Text>
          <Text style={styles.date}>
            {currentTime.format('dddd, D MMMM YYYY')}
          </Text>
          <Text style={styles.time}>
            {currentTime.format('h:mm A')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/(app)/notifications')}
          >
            <Icon name="bell" size={24} color={Colors.primaryBlue600} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Kenya Flag Line */}
      <View style={styles.flagLine}>
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaBlack }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaRed }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaGreen }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaWhite }]} />
      </View>

      {/* Attendance Status Card */}
      <Card style={styles.attendanceCard}>
        <View style={styles.attendanceHeader}>
          <Text style={styles.attendanceTitle}>Today's Attendance</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/attendance')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.attendanceStatus}>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: getAttendanceStatusColor(todaysAttendance?.status),
                },
              ]}
            />
            <Text style={styles.statusText}>
              {getAttendanceStatusText(todaysAttendance?.status)}
            </Text>
          </View>
          
          {todaysAttendance?.check_in_time && (
            <View style={styles.attendanceTimes}>
              <View style={styles.timeRow}>
                <Icon name="log-in" size={16} color={Colors.success500} />
                <Text style={styles.timeText}>
                  Check-in: {dayjs(todaysAttendance.check_in_time).format('h:mm A')}
                </Text>
              </View>
              
              {todaysAttendance?.check_out_time && (
                <View style={styles.timeRow}>
                  <Icon name="log-out" size={16} color={Colors.warning500} />
                  <Text style={styles.timeText}>
                    Check-out: {dayjs(todaysAttendance.check_out_time).format('h:mm A')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {!todaysAttendance?.check_in_time && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={handleCheckIn}
            disabled={isLoading}
          >
            <Icon name="log-in" size={20} color={Colors.white} />
            <Text style={styles.checkInButtonText}>Check In Now</Text>
          </TouchableOpacity>
        )}
        
        {todaysAttendance?.check_in_time && !todaysAttendance?.check_out_time && (
          <TouchableOpacity
            style={styles.checkOutButton}
            onPress={handleCheckOut}
            disabled={isLoading}
          >
            <Icon name="log-out" size={20} color={Colors.white} />
            <Text style={styles.checkOutButtonText}>Check Out</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Monthly Hours"
          value={dashboardData?.monthly_hours || '0'}
          subtitle="hours"
          icon="clock"
          color={Colors.primaryBlue500}
          trend="+12%"
        />
        
        <StatCard
          title="Leave Balance"
          value={dashboardData?.leave_balance || '0'}
          subtitle="days"
          icon="calendar"
          color={Colors.success500}
        />
        
        <StatCard
          title="This Month Pay"
          value={KenyaConstants.currency.format(dashboardData?.current_pay || 0)}
          subtitle="gross"
          icon="credit-card"
          color={Colors.gold500}
        />
        
        <StatCard
          title="Overtime"
          value={dashboardData?.overtime_hours || '0'}
          subtitle="hours"
          icon="zap"
          color={Colors.warning500}
          trend="+5%"
        />
      </View>

      {/* Quick Actions */}
      <QuickActions actions={userActions} />

      {/* Leave Balance */}
      <LeaveBalanceCard balances={dashboardData?.leave_balances} />

      {/* Payroll Summary */}
      <PayrollSummary payroll={dashboardData?.recent_payroll} />

      {/* Recent Activity */}
      <RecentActivity activities={dashboardData?.recent_activities} />

      {/* Kenya Compliance Badge */}
      <View style={styles.complianceBadge}>
        <Icon name="shield-check" size={20} color={Colors.success500} />
        <Text style={styles.complianceText}>
          Compliant with Kenya Labor Laws
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper functions
function getTimeOfDay(time: dayjs.Dayjs): string {
  const hour = time.hour();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function getAttendanceStatusColor(status?: string): string {
  switch (status) {
    case 'PRESENT':
      return Colors.success500;
    case 'LATE':
      return Colors.warning500;
    case 'ABSENT':
      return Colors.danger500;
    case 'ON_LEAVE':
      return Colors.info500;
    default:
      return Colors.gray400;
  }
}

function getAttendanceStatusText(status?: string): string {
  switch (status) {
    case 'PRESENT':
      return 'Present';
    case 'LATE':
      return 'Late';
    case 'ABSENT':
      return 'Absent';
    case 'ON_LEAVE':
      return 'On Leave';
    default:
      return 'Not Checked In';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.md,
  },
  greeting: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.primaryBlue800,
    marginBottom: Layout.spacing.xs,
  },
  date: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  time: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.primaryBlue600,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: Layout.spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.danger500,
    borderRadius: Layout.borderRadius.round,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: Layout.fontSize.xs,
    fontWeight: 'bold',
  },
  flagLine: {
    flexDirection: 'row',
    height: 3,
    borderRadius: Layout.borderRadius.xs,
    overflow: 'hidden',
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  flagSegment: {
    flex: 1,
  },
  attendanceCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  attendanceTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewAllText: {
    color: Colors.primaryBlue600,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  attendanceStatus: {
    marginBottom: Layout.spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: Layout.borderRadius.round,
    marginRight: Layout.spacing.sm,
  },
  statusText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  attendanceTimes: {
    gap: Layout.spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  timeText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    backgroundColor: Colors.success500,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
  },
  checkInButtonText: {
    color: Colors.white,
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    backgroundColor: Colors.warning500,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
  },
  checkOutButtonText: {
    color: Colors.white,
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    backgroundColor: Colors.success50,
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success200,
  },
  complianceText: {
    color: Colors.success700,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});