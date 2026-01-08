// app/(app)/leaves/approvals.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { leaveApi } from '@/lib/api/client';
import { Loading } from '@/components/ui/Loading';
import { Error } from '@/components/ui/Error';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

export default function PendingApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading, error, refetch } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: () => leaveApi.getPendingApprovals(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => 
      leaveApi.approveLeaveRequest(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      Alert.alert('Success', 'Leave request approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => 
      leaveApi.rejectLeaveRequest(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      Alert.alert('Success', 'Leave request rejected');
    },
  });

  const handleApprove = (id: string) => {
    Alert.prompt(
      'Approve Leave Request',
      'Add optional comments:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: (comments) => approveMutation.mutate({ id, comments }) 
        },
      ]
    );
  };

  const handleReject = (id: string) => {
    Alert.prompt(
      'Reject Leave Request',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          onPress: (comments) => rejectMutation.mutate({ id, comments }) 
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading message="Loading pending approvals..." />;
  }

  if (error) {
    return <Error message="Failed to load pending approvals" onRetry={refetch} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <Text style={styles.headerSubtitle}>
          {pendingApprovals?.length || 0} requests waiting for your approval
        </Text>
      </View>

      {pendingApprovals?.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="check-circle" type="feather" size={64} color={Colors.success500} />
          <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
          <Text style={styles.emptyStateText}>
            No pending approvals at the moment.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {pendingApprovals?.map((approval: any) => (
            <Card key={approval.id} style={styles.approvalCard}>
              <TouchableOpacity
                onPress={() => router.push(`/leaves/request/${approval.leave_request.id}`)}
              >
                <View style={styles.approvalHeader}>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>
                      {approval.leave_request.employee_name}
                    </Text>
                    <Text style={styles.leaveType}>
                      {approval.leave_request.leave_type_name}
                    </Text>
                  </View>
                  <Chip
                    label={`Level ${approval.approval_level}`}
                    color={Colors.info500}
                    size="small"
                  />
                </View>

                <View style={styles.dates}>
                  <Icon name="calendar" type="feather" size={12} color={Colors.textSecondary} />
                  <Text style={styles.datesText}>
                    {formatDate(approval.leave_request.start_date)} - {formatDate(approval.leave_request.end_date)}
                  </Text>
                </View>

                <Text style={styles.reason} numberOfLines={2}>
                  {approval.leave_request.reason}
                </Text>

                <View style={styles.approvalFooter}>
                  <Text style={styles.appliedText}>
                    Applied {formatRelativeTime(approval.leave_request.applied_date)}
                  </Text>
                  
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(approval.leave_request.id)}
                      disabled={rejectMutation.isPending || approveMutation.isPending}
                    >
                      <Icon name="x" type="feather" size={16} color={Colors.white} />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(approval.leave_request.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Icon name="check" type="feather" size={16} color={Colors.white} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Layout.spacing.lg,
    backgroundColor: Colors.primaryBlue500,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    padding: Layout.spacing.lg,
  },
  approvalCard: {
    marginBottom: Layout.spacing.md,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.sm,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  leaveType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  datesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  reason: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  approvalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  rejectButton: {
    backgroundColor: Colors.danger500,
  },
  approveButton: {
    backgroundColor: Colors.success500,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
    marginLeft: 4,
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
    marginLeft: 4,
  },
});