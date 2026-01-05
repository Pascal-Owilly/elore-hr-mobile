// lib/hooks/useLeave.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'unpaid';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  days: number;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  attachments?: string[];
}

export const useLeave = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch leave balance
  const getLeaveBalance = useQuery({
    queryKey: ['leave', 'balance', user?.id],
    queryFn: async () => {
      const response = await fetch('http://your-api-url/api/leave/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leave balance');
      }
      
      return response.json();
    },
    enabled: !!token && !!user,
  });

  // Fetch leave requests
  const getLeaveRequests = (status?: string) => {
    return useQuery({
      queryKey: ['leave', 'requests', status, user?.id],
      queryFn: async () => {
        const url = status 
          ? `http://your-api-url/api/leave/requests?status=${status}`
          : 'http://your-api-url/api/leave/requests';
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch leave requests');
        }
        
        return response.json();
      },
      enabled: !!token && !!user,
    });
  };

  // Apply for leave mutation
  const applyLeaveMutation = useMutation({
    mutationFn: async (data: Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'approvedBy' | 'approvedAt'>) => {
      const response = await fetch('http://your-api-url/api/leave/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply for leave');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests'] });
    },
  });

  return {
    // Data
    leaveBalance: getLeaveBalance.data,
    getLeaveRequests,
    
    // Actions
    applyLeave: applyLeaveMutation.mutate,
    applyLeaveAsync: applyLeaveMutation.mutateAsync,
    isApplying: applyLeaveMutation.isPending,
    
    // Status
    isLoading: getLeaveBalance.isLoading,
    isError: getLeaveBalance.isError,
    error: getLeaveBalance.error,
  };
};