import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { AttendanceCalendar } from '@components/attendance/AttendanceCalendar';
import { AttendanceStats } from '@components/attendance/AttendanceStats';
import { RecentAttendance } from '@components/attendance/RecentAttendance';
import { api } from '@lib/api/client';
import { useLocation } from '@lib/hooks/useLocation';
import { Error } from '@components/ui/Error';
import { Loading } from '@components/ui/Loading';
import { toBoolean, parseDjangoNumber } from '@lib/utils/typeUtils';

// Helper to safely convert Django string booleans to actual booleans
const parseDjangoBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

// Helper to safely parse Django numeric strings
// const parseDjangoNumber = (value: any): number => {
//   if (typeof value === 'number') return value;
//   if (typeof value === 'string') return parseFloat(value) || 0;
//   return 0;
// };

// Types - Updated to match your backend
interface Attendance {
  id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND' | 'HOLIDAY';
  total_hours: number;
  overtime_hours: number;
  is_within_geofence: boolean;
  distance_from_expected?: number;
}

interface AttendanceSummary {
  period: string;
  start_date: string;
  end_date: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
  overtime_hours: number;
  attendance_rate: number;
}

interface MonthlyData {
  calendar: Array<{
    date: string;
    status: string;
    check_in_time?: string;
    check_out_time?: string;
    total_hours: number;
  }>;
  stats: AttendanceSummary;
  recent: Attendance[];
}

interface GeofenceResult {
  is_within_geofence: boolean;
  distance?: number;
  geofence_radius?: number;
  branch_name?: string;
  message?: string;
}

export default function AttendanceScreen() {
  const queryClient = useQueryClient();
  const { 
    location: expoLocation, 
    address, 
    getCurrentLocation, 
    isLoading: locationLoading,
    error: locationError 
  } = useLocation();
  
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [refreshing, setRefreshing] = useState(false);

  // Debug location
  useEffect(() => {
    console.log('🔍 Location debug:', {
      expoLocation,
      hasCoords: !!expoLocation?.coords,
      lat: expoLocation?.coords?.latitude,
      lng: expoLocation?.coords?.longitude,
      address,
    });
  }, [expoLocation, address]);

  // Helper to get coordinates from location object - FIXED for 6 decimal places
  const getCoordinates = () => {
    if (!expoLocation?.coords) return null;
    
    // Round coordinates to 6 decimal places to match Django DecimalField validation
    const latitude = parseFloat(expoLocation.coords.latitude.toFixed(6));
    const longitude = parseFloat(expoLocation.coords.longitude.toFixed(6));
    
    console.log('📍 Coordinates (rounded to 6 decimals):', { latitude, longitude });
    
    return {
      latitude,
      longitude,
    };
  };

  // Fetch today's attendance
  const { 
    data: todayAttendance, 
    isLoading: todayLoading,
    error: todayError,
    refetch: refetchToday 
  } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const response = await api.get('/attendance/today/');
      return response.data;
    },
    retry: 1,
  });

  // Fetch monthly attendance data
  const { 
    data: monthlyData, 
    isLoading: monthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly 
  } = useQuery({
    queryKey: ['attendance', 'monthly', selectedDate.format('YYYY-MM')],
    queryFn: async () => {
      const response = await api.get('/attendance/monthly/', {
        params: {
          month: selectedDate.format('YYYY-MM'),
        },
      });
      return response.data;
    },
  });

  // Fetch attendance summary
  const { 
    data: attendanceSummary, 
    isLoading: summaryLoading,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: async () => {
      const response = await api.get('/attendance/summary/', {
        params: {
          period: 'month',
        },
      });
      return response.data;
    },
  });

  // Check-in mutation - FIXED for 6 decimal places validation
  const checkInMutation = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      console.log('📡 Sending check-in to backend:', coords);
      
      // Round coordinates to 6 decimal places to match Django validation
      const roundedCoords = {
        latitude: parseFloat(coords.latitude.toFixed(6)),
        longitude: parseFloat(coords.longitude.toFixed(6)),
      };
      
      console.log('📍 Rounded coordinates for API:', roundedCoords);
      
      const response = await api.post('/attendance/check-in/', {
        latitude: roundedCoords.latitude,
        longitude: roundedCoords.longitude,
        remarks: 'Checked in via mobile app',
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Check-in successful:', data);
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summary'] });
      
      Alert.alert(
        'Success', 
        `Checked in successfully! ${data.geofence?.is_within_geofence ? '' : 'Note: Outside geofence area.'}`,
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      console.error('❌ Check-in error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unable to check in';
      Alert.alert('Check-in Failed', errorMessage);
    },
  });

  // Check-out mutation - FIXED for 6 decimal places validation
  const checkOutMutation = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number }) => {
      console.log('📡 Sending check-out to backend:', coords);
      
      // Round coordinates to 6 decimal places to match Django validation
      const roundedCoords = {
        latitude: parseFloat(coords.latitude.toFixed(6)),
        longitude: parseFloat(coords.longitude.toFixed(6)),
      };
      
      console.log('📍 Rounded coordinates for API:', roundedCoords);
      
      const response = await api.post('/attendance/check-out/', {
        latitude: roundedCoords.latitude,
        longitude: roundedCoords.longitude,
        remarks: 'Checked out via mobile app',
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Check-out successful:', data);
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'summary'] });
      
      Alert.alert('Success', 'Checked out successfully!');
    },
    onError: (error: any) => {
      console.error('❌ Check-out error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unable to check out';
      Alert.alert('Check-out Failed', errorMessage);
    },
  });

  const handleCheckIn = async () => {
    console.log('🔄 Starting check-in...');
    
    const coords = getCoordinates();
    if (!coords) {
      Alert.alert(
        'Location Required',
        'Please enable location services to check in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get Location', 
            onPress: async () => {
              console.log('🔄 Getting location...');
              try {
                await getCurrentLocation();
                handleCheckIn();
              } catch (error) {
                console.error('❌ Location error:', error);
                Alert.alert('Location Error', 'Failed to get location. Please check permissions.');
              }
            } 
          }
        ]
      );
      return;
    }

    console.log('📍 Using coordinates:', coords);
    checkInMutation.mutate(coords);
  };

  const handleCheckOut = async () => {
    console.log('🔄 Starting check-out...');
    
    const coords = getCoordinates();
    if (!coords) {
      Alert.alert(
        'Location Required',
        'Please enable location services to check out.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get Location', 
            onPress: async () => {
              console.log('🔄 Getting location...');
              try {
                await getCurrentLocation();
                handleCheckOut();
              } catch (error) {
                console.error('❌ Location error:', error);
                Alert.alert('Location Error', 'Failed to get location. Please check permissions.');
              }
            } 
          }
        ]
      );
      return;
    }

    console.log('📍 Using coordinates:', coords);
    checkOutMutation.mutate(coords);
  };

  const handleLocationRefresh = async () => {
    console.log('🔄 Refreshing location...');
    try {
      await getCurrentLocation();
      Alert.alert('Location Updated', 'Your location has been refreshed.');
    } catch (error) {
      console.error('❌ Location refresh error:', error);
      Alert.alert('Location Error', 'Failed to refresh location.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchToday(),
      refetchMonthly(),
      refetchSummary(),
    ]);
    setRefreshing(false);
  };

  const canCheckIn = !todayAttendance?.check_in_time;
  const canCheckOut = todayAttendance?.check_in_time && !todayAttendance?.check_out_time;
  const isCheckingIn = checkInMutation.isPending;
  const isCheckingOut = checkOutMutation.isPending;

  const isLoading = todayLoading || monthlyLoading || locationLoading;
  const hasError = todayError || monthlyError;

  // Show loading only for initial load
  if (isLoading && !refreshing && !todayAttendance) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Attendance</Text>
            <Text style={styles.subtitle}>
              Track your daily attendance and working hours
            </Text>
          </View>
<TouchableOpacity
  style={styles.locationButton}
  onPress={handleLocationRefresh}
  disabled={toBoolean(locationLoading || refreshing || isCheckingIn || isCheckingOut)}
>
  <Icon 
    name="navigation" 
    size={20} 
    color={toBoolean(locationLoading || refreshing || isCheckingIn || isCheckingOut) ? Colors.textDisabled : Colors.primaryBlue600} 
  />
</TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Loading message="Loading attendance data..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Always visible */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.subtitle}>
            Track your daily attendance and working hours
          </Text>
        </View>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleLocationRefresh}
          disabled={locationLoading || refreshing || isCheckingIn || isCheckingOut}
        >
          <Icon 
            name="navigation" 
            size={20} 
            color={locationLoading || refreshing || isCheckingIn || isCheckingOut ? Colors.textDisabled : Colors.primaryBlue600} 
          />
        </TouchableOpacity>
      </View>

      {/* Kenya Flag Line */}
      <View style={styles.flagLine}>
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaBlack }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaRed }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaGreen }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaWhite }]} />
      </View>

      {/* Content Area with ScrollView */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primaryBlue500]}
            enabled={!isCheckingIn && !isCheckingOut}
          />
        }
      >
        {/* Error State - Contained within content */}
        {hasError && !todayAttendance && (
          <View style={styles.errorContainer}>
            <Error
              message="Failed to load attendance data"
              onRetry={handleRefresh}
              compact
            />
          </View>
        )}

        {/* Main Content - Only show if no critical error */}
        {(!hasError || todayAttendance) && (
          <>
            {/* Current Status Card */}
            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>Today's Status</Text>
                <Text style={styles.currentDate}>
                  {dayjs().format('dddd, D MMMM YYYY')}
                </Text>
              </View>

              <View style={styles.statusContent}>
                <View style={styles.statusIndicator}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: getStatusColor(todayAttendance?.status),
                      },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {getStatusText(todayAttendance?.status)}
                  </Text>
                </View>

                {expoLocation?.coords && (
                  <View style={styles.locationInfo}>
                    <Icon name="place" size={16} color={Colors.textSecondary} />
                    <Text style={styles.locationText} numberOfLines={2}>
                      {address || `GPS: ${expoLocation.coords.latitude.toFixed(6)}, ${expoLocation.coords.longitude.toFixed(6)}`}
                    </Text>
                  </View>
                )}

{todayAttendance?.distance_from_expected && (
  <View style={styles.distanceInfo}>
    <Icon 
      name="map" 
      size={16} 
      color={toBoolean(todayAttendance.is_within_geofence) ? Colors.success500 : Colors.warning500} 
    />
    <Text style={[
      styles.distanceText, 
      { color: toBoolean(todayAttendance.is_within_geofence) ? Colors.success500 : Colors.warning500 }
    ]}>
      {toBoolean(todayAttendance.is_within_geofence) ? 'Within geofence' : 'Outside geofence'} 
      {parseDjangoNumber(todayAttendance.distance_from_expected) > 1000 
        ? ` (${(parseDjangoNumber(todayAttendance.distance_from_expected) / 1000).toFixed(1)}km)` 
        : ` (${parseDjangoNumber(todayAttendance.distance_from_expected).toFixed(0)}m)`}
    </Text>
  </View>
)}

                <View style={styles.actionButtons}>
                  {canCheckIn && (
<Button
  title="Check In"
  onPress={handleCheckIn}
  loading={isCheckingIn}
  disabled={toBoolean(isCheckingIn || locationLoading || refreshing || !expoLocation?.coords)}
  style={styles.checkInButton}
  icon={<Icon name="login" size={20} color={Colors.white} />}
/>

                  )}

                  {canCheckOut && (
<Button
  title="Check Out"
  onPress={handleCheckOut}
  loading={isCheckingOut}
  disabled={toBoolean(isCheckingOut || locationLoading || refreshing || !expoLocation?.coords)}
  style={styles.checkOutButton}
  icon={<Icon name="logout" size={20} color={Colors.white} />}
/>
                  )}

                  {!canCheckIn && !canCheckOut && todayAttendance?.check_out_time && (
                    <View style={styles.completedStatus}>
                      <Icon name="check-circle" size={24} color={Colors.success500} />
                      <Text style={styles.completedText}>
                        Attendance completed for today
                      </Text>
                    </View>
                  )}
                </View>

{/* Update time display to parse strings */}
{todayAttendance && (
  <View style={styles.todayDetails}>
    {todayAttendance.check_in_time && (
      <View style={styles.timeDetail}>
        <Icon name="login" size={16} color={Colors.success500} />
        <Text style={styles.timeText}>
          In: {dayjs(todayAttendance.check_in_time).format('h:mm A')}
        </Text>
      </View>
    )}
    {todayAttendance.check_out_time && (
      <View style={styles.timeDetail}>
        <Icon name="logout" size={16} color={Colors.warning500} />
        <Text style={styles.timeText}>
          Out: {dayjs(todayAttendance.check_out_time).format('h:mm A')}
        </Text>
      </View>
    )}
    {parseDjangoNumber(todayAttendance.total_hours) > 0 && (
      <View style={styles.timeDetail}>
        <Icon name="clock" size={16} color={Colors.primaryBlue500} />
        <Text style={styles.timeText}>
          Total: {parseDjangoNumber(todayAttendance.total_hours).toFixed(1)} hours
        </Text>
      </View>
    )}
    {parseDjangoNumber(todayAttendance.overtime_hours) > 0 && (
      <View style={styles.timeDetail}>
        <Icon name="zap" size={16} color={Colors.gold500} />
        <Text style={styles.timeText}>
          OT: {parseDjangoNumber(todayAttendance.overtime_hours).toFixed(1)} hours
        </Text>
      </View>
    )}
    {!toBoolean(todayAttendance.is_within_geofence) && (
      <View style={styles.timeDetail}>
        <Icon name="warning" size={16} color={Colors.warning500} />
        <Text style={[styles.timeText, { color: Colors.warning500 }]}>
          Outside geofence
        </Text>
      </View>
    )}
  </View>
)}
              </View>
            </Card>

            {/* Attendance Calendar */}
            {monthlyData?.calendar && (
              <AttendanceCalendar
                attendanceData={monthlyData.calendar}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                loading={monthlyLoading}
              />
            )}

            {/* Attendance Statistics */}
            {attendanceSummary && (
              <AttendanceStats 
                stats={attendanceSummary} 
                loading={summaryLoading}
              />
            )}

            {/* Recent Attendance */}
            {monthlyData?.recent && monthlyData.recent.length > 0 && (
              <RecentAttendance 
                records={monthlyData.recent} 
                loading={monthlyLoading}
              />
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
<TouchableOpacity
  style={styles.quickAction}
  onPress={() => router.push('/(app)/attendance/history')}
  disabled={toBoolean(isCheckingIn || isCheckingOut)}
>
  <View style={[styles.quickActionIcon, { backgroundColor: Colors.primaryBlue50 }]}>
    <Icon name="history" size={24} color={Colors.primaryBlue600} />
  </View>
  <Text style={styles.quickActionText}>History</Text>
</TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/(app)/attendance/reports')}
                disabled={isCheckingIn || isCheckingOut}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.success50 }]}>
                  <Icon name="bar-chart" size={24} color={Colors.success600} />
                </View>
                <Text style={styles.quickActionText}>Reports</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push('/(app)/attendance/locations')}
                disabled={isCheckingIn || isCheckingOut}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.info50 }]}>
                  <Icon name="map" size={24} color={Colors.info600} />
                </View>
                <Text style={styles.quickActionText}>Locations</Text>
              </TouchableOpacity>
            </View>

            {/* Geofencing Info */}
            <Card style={styles.geofenceCard}>
              <View style={styles.geofenceHeader}>
                <Icon name="shield" size={20} color={Colors.primaryBlue500} />
                <Text style={styles.geofenceTitle}>Geofenced Attendance</Text>
              </View>
              <Text style={styles.geofenceText}>
                Your attendance is tracked within approved work locations. Check-ins outside designated areas may require approval.
              </Text>
              <TouchableOpacity
                style={styles.geofenceButton}
                onPress={() => router.push('/(app)/attendance/locations')}
                disabled={isCheckingIn || isCheckingOut}
              >
                <Text style={styles.geofenceButtonText}>View Approved Locations</Text>
                <Icon name="chevron-right" size={20} color={Colors.primaryBlue500} />
              </TouchableOpacity>
            </Card>

            {/* Offline Status */}
            <View style={styles.offlineStatus}>
              <Icon name="wifi-off" size={16} color={Colors.warning500} />
              <Text style={styles.offlineText}>
                Offline mode enabled. Attendance will sync when online.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Helper functions - Updated for new statuses
function getStatusColor(status?: string): string {
  switch (status) {
    case 'PRESENT':
      return Colors.success500;
    case 'LATE':
      return Colors.warning500;
    case 'ABSENT':
      return Colors.danger500;
    case 'ON_LEAVE':
      return Colors.info500;
    case 'WEEKEND':
      return Colors.gray400;
    case 'HOLIDAY':
      return Colors.gold500;
    default:
      return Colors.gray400;
  }
}

function getStatusText(status?: string): string {
  switch (status) {
    case 'PRESENT':
      return 'Present';
    case 'LATE':
      return 'Late';
    case 'ABSENT':
      return 'Absent';
    case 'ON_LEAVE':
      return 'On Leave';
    case 'WEEKEND':
      return 'Weekend';
    case 'HOLIDAY':
      return 'Holiday';
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
    backgroundColor: Colors.backgroundLight,
    zIndex: 1,
  },
  title: {
    fontSize: Layout.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.primaryBlue800,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  locationButton: {
    padding: Layout.spacing.sm,
    backgroundColor: Colors.primaryBlue50,
    borderRadius: Layout.borderRadius.md,
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
  content: {
    flex: 1,
  },
  errorContainer: {
    padding: Layout.spacing.lg,
  },
  statusCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  statusHeader: {
    marginBottom: Layout.spacing.md,
  },
  statusTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  currentDate: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusContent: {
    gap: Layout.spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  locationText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.sm,
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.sm,
  },
  distanceText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  actionButtons: {
    gap: Layout.spacing.sm,
  },
  checkInButton: {
    backgroundColor: Colors.success500,
  },
  checkOutButton: {
    backgroundColor: Colors.warning500,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.success50,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success200,
  },
  completedText: {
    color: Colors.success700,
    fontWeight: '500',
  },
  todayDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  timeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  timeText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  quickActionText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  geofenceCard: {
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.md,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  geofenceTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  geofenceText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    // lineHeight: Layout.lineHeight.normal,
    // marginBottom: Layout.spacing.md,
  },
  geofenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.sm,
  },
  geofenceButtonText: {
    color: Colors.primaryBlue600,
    fontWeight: '500',
  },
  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
    backgroundColor: Colors.warning50,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning200,
  },
  offlineText: {
    color: Colors.warning700,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});