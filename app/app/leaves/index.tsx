import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { LeaveBalanceCard } from '@/components/dashboard/LeaveBalanceCard';
import { api } from '@/lib/api/client';
import { Loading } from '@/components/ui/Loading';
import { Error } from '@/components/ui/Error';
import { formatDate } from '@/lib/utils/format';

// Define your custom color themes
const CustomColors = {
  cream: '#e9ded3',
  primaryBlue: '#0056b3',
  gold: '#deab63',
  success500: '#10b981',
  warning500: '#f59e0b',
  info500: '#3b82f6',
  secondary500: '#8b5cf6',
  danger500: '#ef4444',
  white: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  borderLight: '#e5e7eb',
  background: '#f9fafb',
};

export default function LeavesScreen() {
  const { user, employee } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Get current date for queries
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12 for Django

  // Fetch leave balances (using /leaves/balances/)
  const { 
    data: balanceData, 
    isLoading: balanceLoading, 
    error: balanceError,
    refetch: refetchBalance 
  } = useQuery({
    queryKey: ['leaveBalance', employee?.id, currentYear],
    queryFn: async () => {
      console.log('📊 Fetching leave balances for employee:', employee?.id);
      try {
        const response = await api.get('/leaves/balances/', {
          params: {
            employee: employee?.id,
            year: currentYear,
          }
        });
        console.log('📊 Leave balances response:', response.data);
        
        // Handle different response formats
        if (response.data?.results) {
          return response.data.results;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error: any) {
        console.error('📊 Balance error:', error.response?.data || error.message);
        // If 404, return empty array (balances might not exist yet)
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!employee?.id,
  });

  // Fetch leave requests (using /leaves/requests/)
  const { 
    data: leaveRequests, 
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests 
  } = useQuery({
    queryKey: ['leaveRequests', employee?.id],
    queryFn: async () => {
      console.log('📋 Fetching leave requests for employee:', employee?.id);
      try {
        const response = await api.get('/leaves/requests/', {
          params: {
            employee: employee?.id,
          }
        });
        
        // Handle different response formats
        let data = [];
        if (response.data?.results) {
          data = response.data.results;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }
        
        console.log('📋 Raw leave requests:', data.length);
        return data;
      } catch (error: any) {
        console.error('📋 Requests error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!employee?.id,
  });

  // Fetch leave calendar (requires month and year parameters)
  const { 
    data: calendarData, 
    isLoading: calendarLoading,
    error: calendarError,
    refetch: refetchCalendar 
  } = useQuery({
    queryKey: ['leaveCalendar', employee?.id, currentYear, currentMonth],
    queryFn: async () => {
      console.log('📅 Fetching calendar for:', { month: currentMonth, year: currentYear });
      try {
        const response = await api.get('/leaves/calendar/', {
          params: {
            month: currentMonth,
            year: currentYear,
            employee_id: employee?.id,
          }
        });
        console.log('📅 Calendar response received');
        return response.data;
      } catch (error: any) {
        console.error('📅 Calendar error:', error.response?.data || error.message);
        // Return empty calendar structure on error
        return {
          month: currentMonth,
          year: currentYear,
          calendar: []
        };
      }
    },
    enabled: !!employee?.id,
  });

  // Fetch leave approvals pending (if user is manager)
  const { 
    data: pendingApprovals, 
    isLoading: approvalsLoading,
    error: approvalsError,
    refetch: refetchApprovals 
  } = useQuery({
    queryKey: ['leaveApprovals', user?.id],
    queryFn: async () => {
      console.log('👨‍💼 Fetching approvals for user:', user?.id);
      try {
        const response = await api.get('/leaves/approvals/', {
          params: {
            decision: 'PENDING',
            approver: user?.id,
          }
        });
        
        let data = [];
        if (response.data?.results) {
          data = response.data.results;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }
        
        console.log('👨‍💼 Pending approvals:', data.length);
        return data;
      } catch (error: any) {
        // If 404 or no permissions, return empty array
        if (error.response?.status === 404 || error.response?.status === 403) {
          console.log('👨‍💼 No approvals found or not authorized');
          return [];
        }
        console.error('👨‍💼 Approvals error:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Get upcoming leaves from the calendar data
  const upcomingLeaves = useMemo(() => {
    if (!calendarData?.calendar) return [];
    
    const today = new Date().toISOString().split('T')[0];
    const upcoming = calendarData.calendar
      .filter((day: any) => day.date >= today && day.leaves?.length > 0)
      .flatMap((day: any) => 
        day.leaves.map((leave: any) => ({
          ...leave,
          date: day.date,
          employee_name: leave.employee || 'Employee',
          leave_type: leave.leave_type || 'Leave',
        }))
      )
      .slice(0, 5);
    
    return upcoming;
  }, [calendarData]);

  // Calculate dashboard statistics from the data we have
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Calculate from leave requests
    const leaveRequestsData = leaveRequests || [];
    const pendingRequests = leaveRequestsData.filter(
      (req: any) => req.status === 'PENDING'
    ).length;
    
    const approvedThisMonth = leaveRequestsData.filter((req: any) => {
      if (req.status === 'APPROVED') {
        const approvedDate = new Date(req.approved_date || req.created_at);
        return approvedDate.getMonth() === now.getMonth() && 
               approvedDate.getFullYear() === now.getFullYear();
      }
      return false;
    }).length;
    
    // Calculate from calendar data
    const onLeaveToday = calendarData?.calendar?.find(
      (day: any) => day.date === today
    )?.leaves?.length || 0;
    
    // Calculate total days taken from balances
    const balanceDataArray = balanceData || [];
    const totalDaysTaken = balanceDataArray.reduce((total: number, item: any) => {
      return total + (parseFloat(item.taken) || 0);
    }, 0);
    
    // Calculate total remaining days
    const totalRemainingDays = balanceDataArray.reduce((total: number, item: any) => {
      return total + (parseFloat(item.balance) || 0);
    }, 0);
    
    return {
      total_remaining_days: totalRemainingDays,
      pending_approvals: pendingApprovals?.length || 0,
      on_leave_today: onLeaveToday,
      pending_requests: pendingRequests,
      current_month_approved: approvedThisMonth,
      total_days_taken: totalDaysTaken,
    };
  }, [balanceData, leaveRequests, calendarData, pendingApprovals]);

  const onRefresh = async () => {
    console.log('🔄 Refreshing leave data...');
    setRefreshing(true);
    try {
      await Promise.all([
        refetchBalance(),
        refetchRequests(),
        refetchCalendar(),
        refetchApprovals(),
      ]);
      console.log('✅ Leave data refreshed');
    } catch (error) {
      console.error('❌ Refresh error:', error);
      Alert.alert('Refresh Error', 'Failed to refresh leave data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = balanceLoading || requestsLoading || calendarLoading || approvalsLoading;
  const hasError = balanceError || requestsError || calendarError || approvalsError;

  // Quick actions with valid Feather icons
  const quickActions = [ 
    {
      title: 'Apply Leave',
      icon: 'plus-circle',
      color: CustomColors.primaryBlue,
      onPress: () => router.push('/app/leaves/apply'),
    },
    {
      title: 'My Requests',
      icon: 'file-text',
      color: CustomColors.success500,
      onPress: () => router.push('/app/leaves/requests'),
    },
    {
      title: 'Calendar',
      icon: 'calendar',
      color: CustomColors.warning500,
      onPress: () => router.push('/app/leaves/calendar'),
    },
    {
      title: 'Holidays',
      icon: 'sun',
      color: CustomColors.secondary500,
      onPress: () => router.push('/app/leaves/holidays'),
    },
  ];

  // Process balance data
  const balances = useMemo(() => {
    const balanceDataArray = balanceData || [];
    
    if (balanceDataArray.length === 0) {
      // If no balances exist, show default/empty state
      return [{
        type: 'annual',
        total: 21, // Default annual leave days in Kenya
        taken: 0,
        remaining: 21,
        leaveTypeId: 'default',
        leaveTypeName: 'Annual Leave',
      }];
    }
    
    return balanceDataArray.map((item: any) => ({
      type: item.leave_type_code?.toLowerCase() || 
            item.leave_type_name?.toLowerCase() || 
            item.leave_type?.name?.toLowerCase() || 
            'annual',
      total: parseFloat(item.total_entitled || item.entitled_days || 0),
      taken: parseFloat(item.taken || item.days_taken || 0),
      remaining: parseFloat(item.balance || item.remaining_days || 0),
      leaveTypeId: item.leave_type_id || item.id,
      leaveTypeName: item.leave_type_name || item.leave_type?.name || 'Annual Leave',
    }));
  }, [balanceData]);

  // Check if we have any data at all
  const hasData = useMemo(() => {
    return (balanceData && balanceData.length > 0) || 
           (leaveRequests && leaveRequests.length > 0) ||
           (calendarData?.calendar && calendarData.calendar.length > 0);
  }, [balanceData, leaveRequests, calendarData]);

  // Add error handling display
  if (!employee?.id) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" type="feather" size={48} color={CustomColors.danger500} />
        <Text style={styles.errorTitle}>Employee Data Missing</Text>
        <Text style={styles.errorText}>
          Unable to load leave data. Please check if your employee profile is set up.
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return <Loading message="Loading leave dashboard..." />;
  }

  if (hasError && !refreshing) {
    return (
      <Error 
        message="Failed to load leave data" 
        onRetry={onRefresh}
        details="Check your connection and try again"
      />
    );
  }

  // Check if we're showing empty state
  const isEmptyState = !hasData && !isLoading && !hasError;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[CustomColors.primaryBlue]}
          tintColor={CustomColors.primaryBlue}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Leave Management</Text>
          <Text style={styles.subtitle}>
            {employee?.organization?.name || 'Organization not set'}
          </Text>
        </View>
        {pendingApprovals?.length > 0 && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/app/leaves/approvals')}
          >
            <Icon name="bell" type="feather" size={20} color={CustomColors.white} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pendingApprovals.length}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {isEmptyState && (
        <View style={styles.emptyContainer}>
          <Icon name="calendar" type="feather" size={64} color={CustomColors.textSecondary} />
          <Text style={styles.emptyTitle}>No Leave Data Available</Text>
          <Text style={styles.emptyText}>
            You don't have any leave records yet. Apply for your first leave or check back later.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/app/leaves/apply')}
          >
            <Text style={styles.emptyButtonText}>Apply for Leave</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Data Sections - Only show if we have data */}
      {hasData && (
        <>
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Icon name={action.icon} type="feather" size={24} color={CustomColors.white} />
                  </View>
                  <Text style={styles.actionText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Leave Balance */}
          <View style={styles.section}>
            <LeaveBalanceCard
              balances={balances}
              onApplyLeave={() => router.push('/app/leaves/apply')}
              onViewDetails={() => router.push('/app/leaves/requests')}
              title="My Leave Balance"
            />
          </View>

          {/* Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="On Leave Today"
                value={stats.on_leave_today}
                icon={{ name: 'users', type: 'feather', color: CustomColors.info500 }}
                change={null}
                variant="default"
              />
              <StatCard
                title="Pending Requests"
                value={stats.pending_requests}
                icon={{ name: 'clock', type: 'feather', color: CustomColors.warning500 }}
                change={null}
                variant="default"
              />
              <StatCard
                title="Approved This Month"
                value={stats.current_month_approved}
                icon={{ name: 'check-circle', type: 'feather', color: CustomColors.success500 }}
                change={null}
                variant="default"
              />
              <StatCard
                title="Leave Days Used"
                value={stats.total_days_taken}
                icon={{ name: 'calendar', type: 'feather', color: CustomColors.primaryBlue }}
                change={null}
                variant="default"
              />
            </View>
          </View>

          {/* Upcoming Leaves */}
          {upcomingLeaves.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Leaves</Text>
                <TouchableOpacity onPress={() => router.push('/app/leaves/calendar')}>
                  <Text style={styles.seeAll}>See Calendar</Text>
                </TouchableOpacity>
              </View>
              <Card>
                {upcomingLeaves.map((leave: any, index: number) => (
                  <View key={`${leave.leave_id || leave.employee_id || index}`} style={styles.upcomingItem}>
                    <View style={styles.upcomingInfo}>
                      <Text style={styles.upcomingName}>
                        {leave.employee_name}
                      </Text>
                      <Text style={styles.upcomingDates}>
                        {formatDate(leave.date)}
                      </Text>
                      <Text style={styles.upcomingType}>
                        {leave.leave_type}
                      </Text>
                    </View>
                    {leave.leave_id && (
                      <TouchableOpacity onPress={() => router.push(`/app/leaves/request/${leave.leave_id}`)}>
                        <Icon name="chevron-right" type="feather" size={20} color={CustomColors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </Card>
            </View>
          )}
        </>
      )}

      {/* Debug section - remove in production */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Employee ID: {employee?.id || 'None'}
          </Text>
          <Text style={styles.debugText}>
            Has Balance Data: {(balanceData?.length || 0) > 0 ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.debugText}>
            Has Leave Requests: {(leaveRequests?.length || 0) > 0 ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.debugText}>
            Calendar Days: {calendarData?.calendar?.length || 0}
          </Text>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              console.log('=== LEAVE DATA DEBUG ===');
              console.log('Balance Data:', balanceData);
              console.log('Leave Requests:', leaveRequests);
              console.log('Calendar Data:', calendarData);
              console.log('Pending Approvals:', pendingApprovals);
              console.log('Employee:', employee);
              console.log('========================');
            }}
          >
            <Text style={styles.debugButtonText}>Log API Data</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CustomColors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg + 10,
    backgroundColor: CustomColors.primaryBlue,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CustomColors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: CustomColors.white,
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: Layout.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Layout.borderRadius.md,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: CustomColors.danger500,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: CustomColors.primaryBlue,
  },
  badgeText: {
    color: CustomColors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
    marginTop: Layout.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CustomColors.textPrimary,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: CustomColors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: CustomColors.primaryBlue,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.md,
  },
  emptyButtonText: {
    color: CustomColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: CustomColors.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  seeAll: {
    fontSize: 14,
    color: CustomColors.primaryBlue,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: CustomColors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    alignItems: 'center',
    ...Layout.shadow.sm,
    borderWidth: 1,
    borderColor: `${CustomColors.primaryBlue}20`,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: CustomColors.textPrimary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  upcomingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: CustomColors.borderLight,
  },
  upcomingInfo: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  upcomingName: {
    fontSize: 14,
    fontWeight: '500',
    color: CustomColors.textPrimary,
    marginBottom: 2,
  },
  upcomingDates: {
    fontSize: 12,
    color: CustomColors.textSecondary,
    marginBottom: 2,
  },
  upcomingType: {
    fontSize: 12,
    color: CustomColors.textTertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: CustomColors.cream,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CustomColors.danger500,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: CustomColors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  refreshButton: {
    backgroundColor: CustomColors.primaryBlue,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  refreshButtonText: {
    color: CustomColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  debugSection: {
    margin: Layout.spacing.lg,
    marginTop: Layout.spacing.xl,
    padding: Layout.spacing.md,
    backgroundColor: '#f0f0f0',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: CustomColors.borderLight,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.sm,
    color: CustomColors.textPrimary,
  },
  debugText: {
    fontSize: 12,
    color: CustomColors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  debugButton: {
    marginTop: Layout.spacing.sm,
    padding: Layout.spacing.sm,
    backgroundColor: CustomColors.primaryBlue,
    borderRadius: Layout.borderRadius.sm,
    alignItems: 'center',
  },
  debugButtonText: {
    color: CustomColors.white,
    fontSize: 12,
    fontWeight: '500',
  },
});