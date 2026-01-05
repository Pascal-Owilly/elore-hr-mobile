import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
import { useAttendance } from '@lib/hooks/useAttendance';
import { useLocation } from '@lib/hooks/useLocation';

export default function AttendanceScreen() {
  const { todaysAttendance, checkIn, checkOut, isLoading: attendanceLoading } = useAttendance();
  const { location, getCurrentLocation } = useLocation();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Fetch attendance data
  const { data: attendanceData, refetch, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate.format('YYYY-MM')],
    queryFn: async () => {
      const response = await api.get('/attendance/', {
        params: {
          month: selectedDate.format('YYYY-MM'),
        },
      });
      return response.data;
    },
  });

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert(
        'Location Required',
        'Please enable location services to check in.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCheckingIn(true);
    try {
      await checkIn(location);
      await refetch();
      Alert.alert('Success', 'Checked in successfully!');
    } catch (error: any) {
      Alert.alert('Check-in Failed', error.message || 'Unable to check in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      Alert.alert(
        'Location Required',
        'Please enable location services to check out.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCheckingOut(true);
    try {
      await checkOut(location);
      await refetch();
      Alert.alert('Success', 'Checked out successfully!');
    } catch (error: any) {
      Alert.alert('Check-out Failed', error.message || 'Unable to check out');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLocationRefresh = async () => {
    await getCurrentLocation();
  };

  const canCheckIn = !todaysAttendance?.check_in_time;
  const canCheckOut = todaysAttendance?.check_in_time && !todaysAttendance?.check_out_time;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Actions */}
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
        >
          <Icon name="navigation" size={20} color={Colors.primaryBlue600} />
        </TouchableOpacity>
      </View>

      {/* Kenya Flag Line */}
      <View style={styles.flagLine}>
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaBlack }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaRed }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaGreen }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaWhite }]} />
      </View>

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
                  backgroundColor: getStatusColor(todaysAttendance?.status),
                },
              ]}
            />
            <Text style={styles.statusText}>
              {getStatusText(todaysAttendance?.status)}
            </Text>
          </View>

          {location && (
            <View style={styles.locationInfo}>
              <Icon name="map-pin" size={16} color={Colors.textSecondary} />
              <Text style={styles.locationText}>
                {location.address || 'Location acquired'}
              </Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            {canCheckIn && (
              <Button
                title="Check In"
                onPress={handleCheckIn}
                loading={isCheckingIn}
                disabled={isCheckingIn || attendanceLoading}
                style={styles.checkInButton}
                icon={<Icon name="log-in" size={20} color={Colors.white} />}
              />
            )}

            {canCheckOut && (
              <Button
                title="Check Out"
                onPress={handleCheckOut}
                loading={isCheckingOut}
                disabled={isCheckingOut || attendanceLoading}
                style={styles.checkOutButton}
                icon={<Icon name="log-out" size={20} color={Colors.white} />}
              />
            )}

            {!canCheckIn && !canCheckOut && todaysAttendance?.check_out_time && (
              <View style={styles.completedStatus}>
                <Icon name="check-circle" size={24} color={Colors.success500} />
                <Text style={styles.completedText}>
                  Attendance completed for today
                </Text>
              </View>
            )}
          </View>

          {todaysAttendance && (
            <View style={styles.todayDetails}>
              {todaysAttendance.check_in_time && (
                <View style={styles.timeDetail}>
                  <Icon name="log-in" size={16} color={Colors.success500} />
                  <Text style={styles.timeText}>
                    In: {dayjs(todaysAttendance.check_in_time).format('h:mm A')}
                  </Text>
                </View>
              )}
              {todaysAttendance.check_out_time && (
                <View style={styles.timeDetail}>
                  <Icon name="log-out" size={16} color={Colors.warning500} />
                  <Text style={styles.timeText}>
                    Out: {dayjs(todaysAttendance.check_out_time).format('h:mm A')}
                  </Text>
                </View>
              )}
              {todaysAttendance.total_hours > 0 && (
                <View style={styles.timeDetail}>
                  <Icon name="clock" size={16} color={Colors.primaryBlue500} />
                  <Text style={styles.timeText}>
                    Total: {todaysAttendance.total_hours.toFixed(1)} hours
                  </Text>
                </View>
              )}
              {todaysAttendance.overtime_hours > 0 && (
                <View style={styles.timeDetail}>
                  <Icon name="zap" size={16} color={Colors.gold500} />
                  <Text style={styles.timeText}>
                    OT: {todaysAttendance.overtime_hours.toFixed(1)} hours
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Card>

      {/* Attendance Calendar */}
      <AttendanceCalendar
        attendanceData={attendanceData?.calendar}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Attendance Statistics */}
      <AttendanceStats stats={attendanceData?.stats} />

      {/* Recent Attendance */}
      <RecentAttendance records={attendanceData?.recent} />

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
    </ScrollView>
  );
}

// Helper functions
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
    lineHeight: Layout.lineHeight.normal,
    marginBottom: Layout.spacing.md,
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