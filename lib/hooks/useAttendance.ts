// lib/hooks/useAttendance.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  totalHours?: number;
  overtime?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

export interface AttendanceStats {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  averageHours: number;
  totalOvertime: number;
}

export const useAttendance = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch today's attendance
  const getTodayAttendance = useQuery({
    queryKey: ['attendance', 'today', user?.id],
    queryFn: async () => {
      // TODO: Replace with your actual API endpoint
      const response = await fetch('http://your-api-url/api/attendance/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch today\'s attendance');
      }
      
      return response.json();
    },
    enabled: !!token && !!user,
  });

  // Fetch attendance records for a date range
  const getAttendanceRecords = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: ['attendance', 'records', startDate, endDate, user?.id],
      queryFn: async () => {
        const response = await fetch(
          `http://your-api-url/api/attendance?startDate=${startDate}&endDate=${endDate}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch attendance records');
        }
        
        return response.json();
      },
      enabled: !!token && !!user,
    });
  };

  // Fetch attendance statistics
  const getAttendanceStats = (month: string, year: string) => {
    return useQuery({
      queryKey: ['attendance', 'stats', month, year, user?.id],
      queryFn: async () => {
        const response = await fetch(
          `http://your-api-url/api/attendance/stats?month=${month}&year=${year}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch attendance statistics');
        }
        
        return response.json();
      },
      enabled: !!token && !!user,
    });
  };

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: { location?: { latitude: number; longitude: number; address?: string }; notes?: string }) => {
      const response = await fetch('http://your-api-url/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check in');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (data: { location?: { latitude: number; longitude: number; address?: string }; notes?: string }) => {
      const response = await fetch('http://your-api-url/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check out');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
    },
  });

  // Request attendance correction
  const requestCorrectionMutation = useMutation({
    mutationFn: async (data: { date: string; requestedCheckIn?: string; requestedCheckOut?: string; reason: string }) => {
      const response = await fetch('http://your-api-url/api/attendance/correction-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to request attendance correction');
      }
      
      return response.json();
    },
  });

  return {
    // Queries
    todayAttendance: getTodayAttendance,
    getAttendanceRecords,
    getAttendanceStats,
    
    // Mutations
    checkIn: checkInMutation.mutate,
    checkInAsync: checkInMutation.mutateAsync,
    isCheckingIn: checkInMutation.isPending,
    
    checkOut: checkOutMutation.mutate,
    checkOutAsync: checkOutMutation.mutateAsync,
    isCheckingOut: checkOutMutation.isPending,
    
    requestCorrection: requestCorrectionMutation.mutate,
    requestCorrectionAsync: requestCorrectionMutation.mutateAsync,
    isRequestingCorrection: requestCorrectionMutation.isPending,
    
    // Status
    isLoading: getTodayAttendance.isLoading,
    isError: getTodayAttendance.isError,
    error: getTodayAttendance.error,
  };
};