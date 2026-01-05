// lib/hooks/useAttendance.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@lib/api/client';

export interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE';
  total_hours: number;
  overtime_hours: number;
  is_within_geofence: boolean;
  check_in_location?: {
    type: string;
    coordinates: [number, number];
  };
  check_out_location?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface AttendanceStats {
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

interface CheckInData {
  latitude: number;
  longitude: number;
  notes?: string;
}

interface CheckOutData {
  latitude: number;
  longitude: number;
  notes?: string;
}

interface CorrectionRequest {
  date: string;
  requested_check_in?: string;
  requested_check_out?: string;
  reason: string;
}

export const useAttendance = () => {
  const queryClient = useQueryClient();

  // Fetch today's attendance
  const todaysAttendance = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const response = await api.get('/attendance/today/');
      return response.data;
    },
    retry: 1,
  });

  // Fetch attendance records for a date range
  const getAttendanceRecords = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['attendance', 'records', startDate, endDate],
      queryFn: async () => {
        const response = await api.get('/attendance/list/', {
          params: { start_date: startDate, end_date: endDate },
        });
        return response.data;
      },
    });
  };

  // Fetch attendance statistics
  const getAttendanceStats = (period: string = 'month') => {
    return useQuery({
      queryKey: ['attendance', 'stats', period],
      queryFn: async () => {
        const response = await api.get('/attendance/summary/', {
          params: { period },
        });
        return response.data;
      },
    });
  };

  // Fetch monthly attendance data
  const getMonthlyAttendance = (month: string) => {
    return useQuery({
      queryKey: ['attendance', 'monthly', month],
      queryFn: async () => {
        const response = await api.get('/attendance/monthly/', {
          params: { month },
        });
        return response.data;
      },
    });
  };

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInData) => {
      const response = await api.post('/attendance/check-in/', {
        latitude: data.latitude,
        longitude: data.longitude,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'monthly'] });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (data: CheckOutData) => {
      const response = await api.post('/attendance/check-out/', {
        latitude: data.latitude,
        longitude: data.longitude,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'monthly'] });
    },
  });

  // Request attendance correction
  const requestCorrectionMutation = useMutation({
    mutationFn: async (data: CorrectionRequest) => {
      // Note: You need to create this endpoint in Django
      const response = await api.post('/attendance/correction/', data);
      return response.data;
    },
  });

  // Submit offline attendance
  const submitOfflineAttendance = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/attendance/offline/', data);
      return response.data;
    },
  });

  // Verify geofence
  const verifyGeofence = async (latitude: number, longitude: number, branchId?: string) => {
    const response = await api.post('/attendance/verify-geofence/', {
      latitude,
      longitude,
      branch_id: branchId,
    });
    return response.data;
  };

  return {
    // Queries
    todaysAttendance: todaysAttendance.data,
    todaysAttendanceLoading: todaysAttendance.isLoading,
    todaysAttendanceError: todaysAttendance.error,
    refetchToday: todaysAttendance.refetch,
    
    getAttendanceRecords,
    getAttendanceStats,
    getMonthlyAttendance,
    
    // Mutations
    checkIn: checkInMutation.mutate,
    checkInAsync: checkInMutation.mutateAsync,
    isCheckingIn: checkInMutation.isPending,
    checkInError: checkInMutation.error,
    
    checkOut: checkOutMutation.mutate,
    checkOutAsync: checkOutMutation.mutateAsync,
    isCheckingOut: checkOutMutation.isPending,
    checkOutError: checkOutMutation.error,
    
    requestCorrection: requestCorrectionMutation.mutate,
    requestCorrectionAsync: requestCorrectionMutation.mutateAsync,
    isRequestingCorrection: requestCorrectionMutation.isPending,
    
    submitOfflineAttendance: submitOfflineAttendance.mutate,
    submitOfflineAttendanceAsync: submitOfflineAttendance.mutateAsync,
    isSubmittingOffline: submitOfflineAttendance.isPending,
    
    // Helper functions
    verifyGeofence,
    
    // Combined status
    isLoading: todaysAttendance.isLoading,
    isError: todaysAttendance.isError,
    error: todaysAttendance.error,
  };
};