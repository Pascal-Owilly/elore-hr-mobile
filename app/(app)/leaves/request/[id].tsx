// app/(app)/leaves/request/[id].tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { leaveApi } from '@/lib/api/client';
import { Loading} from '@/components/ui/Loading';
import { Error } from '@/components/ui/Error';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export default function LeaveRequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, employee } = useAuth();
  const queryClient = useQueryClient();

  // Fetch leave request details
  const { data: leaveRequest, isLoading, error, refetch } = useQuery({
    queryKey: ['leaveRequest', id],
    queryFn: () => leaveApi.getLeaveRequest(id),
    enabled: !!id,
  });

  // Fetch timeline
  const { data: timeline } = useQuery({
    queryKey: ['leaveTimeline', id],
    queryFn: () => leaveApi.getLeaveRequestTimeline(id),
    enabled: !!id,
  });

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: () => leaveApi.cancelLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      Alert.alert('Success', 'Leave request cancelled successfully');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to cancel leave request');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (comments?: string) => leaveApi.approveLeaveRequest(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      Alert.alert('Success', 'Leave request approved');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to approve leave request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (comments?: string) => leaveApi.rejectLeaveRequest(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      Alert.alert('Success', 'Leave request rejected');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to reject leave request');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return Colors.success500;
      case 'PENDING': return Colors.warning500;
      case 'REJECTED': return Colors.danger500;
      case 'CANCELLED': return Colors.gray500;
      case 'TAKEN': return Colors.info500;
      case 'DRAFT': return Colors.secondary500;
      default: return Colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'check-circle';
      case 'PENDING': return 'clock';
      case 'REJECTED': return 'x-circle';
      case 'CANCELLED': return 'x';
      case 'TAKEN': return 'calendar-check';
      case 'DRAFT': return 'edit';
      default: return 'file-text';
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Leave Request: ${leaveRequest?.leave_type_name}\n` +
                `Dates: ${formatDate(leaveRequest?.start_date)} - ${formatDate(leaveRequest?.end_date)}\n` +
                `Status: ${leaveRequest?.status}\n` +
                `Reason: ${leaveRequest?.reason}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Leave Request',
      'Are you sure you want to cancel this leave request?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => cancelMutation.mutate() },
      ]
    );
  };

  const handleApprove = () => {
    Alert.prompt(
      'Approve Leave Request',
      'Add optional comments:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: (comments) => approveMutation.mutate(comments) 
        },
      ],
      'plain-text'
    );
  };

  const handleReject = () => {
    Alert.prompt(
      'Reject Leave Request',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          onPress: (comments) => rejectMutation.mutate(comments) 
        },
      ],
      'plain-text'
    );
  };

  if (isLoading) {
    return <Loading message="Loading leave details..." />;
  }

  if (error) {
    return <Error message="Failed to load leave details" onRetry={refetch} />;
  }

  const canApprove = leaveRequest?.can_approve;
  const canCancel = leaveRequest?.can_cancel;
  const isOwner = employee?.id === leaveRequest?.employee?.id;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" type="feather" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.leaveType}>{leaveRequest?.leave_type_name}</Text>
            <Chip
              label={leaveRequest?.status}
              color={getStatusColor(leaveRequest?.status)}
              icon={getStatusIcon(leaveRequest?.status)}
              size="small"
            />
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Icon name="share-2" type="feather" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Basic Information */}
        <Card>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Icon name="calendar" type="feather" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Dates:</Text>
              <Text style={styles.infoValue}>
                {formatDate(leaveRequest?.start_date)} - {formatDate(leaveRequest?.end_date)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="clock" type="feather" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>{leaveRequest?.total_days} working days</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="user" type="feather" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Employee:</Text>
              <Text style={styles.infoValue}>{leaveRequest?.employee_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="clock" type="feather" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Applied On:</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(leaveRequest?.applied_date)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Reason */}
        <Card>
          <Text style={styles.cardTitle}>Reason for Leave</Text>
          <Text style={styles.reasonText}>{leaveRequest?.reason}</Text>
        </Card>

        {/* Contact Information */}
        {(leaveRequest?.contact_number || leaveRequest?.contact_address) && (
          <Card>
            <Text style={styles.cardTitle}>Contact During Leave</Text>
            {leaveRequest?.contact_number && (
              <View style={styles.contactRow}>
                <Icon name="phone" type="feather" size={16} color={Colors.textSecondary} />
                <Text style={styles.contactText}>{leaveRequest.contact_number}</Text>
              </View>
            )}
            {leaveRequest?.contact_address && (
              <View style={styles.contactRow}>
                <Icon name="map-pin" type="feather" size={16} color={Colors.textSecondary} />
                <Text style={styles.contactText}>{leaveRequest.contact_address}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Approval Timeline */}
        {timeline && (
          <Card>
            <Text style={styles.cardTitle}>Approval Timeline</Text>
            {timeline.approval_timeline?.map((approval: any, index: number) => (
              <View key={approval.id} style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Icon
                    name={approval.decision === 'APPROVED' ? 'check' : 
                          approval.decision === 'REJECTED' ? 'x' : 'clock'}
                    type="feather"
                    size={16}
                    color={approval.decision === 'APPROVED' ? Colors.success500 :
                           approval.decision === 'REJECTED' ? Colors.danger500 : Colors.textSecondary}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Level {approval.approval_level}: {approval.approver_name}
                  </Text>
                  <Text style={styles.timelineStatus}>
                    Status: {approval.decision}
                  </Text>
                  {approval.comments && (
                    <Text style={styles.timelineComments}>
                      Comments: {approval.comments}
                    </Text>
                  )}
                  {approval.decision_date && (
                    <Text style={styles.timelineDate}>
                      {formatDateTime(approval.decision_date)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Actions */}
        {leaveRequest?.status === 'PENDING' && (
          <Card>
            <Text style={styles.cardTitle}>Actions</Text>
            <View style={styles.actions}>
              {canApprove && (
                <>
                  <Button
                    title="Approve"
                    variant="success"
                    onPress={handleApprove}
                    loading={approveMutation.isPending}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    style={styles.actionButton}
                  />
                  <Button
                    title="Reject"
                    variant="danger"
                    onPress={handleReject}
                    loading={rejectMutation.isPending}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    style={styles.actionButton}
                  />
                </>
              )}
              {canCancel && (
                <Button
                  title="Cancel Request"
                  variant="outline"
                  onPress={handleCancel}
                  loading={cancelMutation.isPending}
                  disabled={cancelMutation.isPending}
                  style={styles.actionButton}
                />
              )}
            </View>
          </Card>
        )}

        {/* Additional Information */}
        <Card>
          <Text style={styles.cardTitle}>Additional Information</Text>
          <View style={styles.additionalInfo}>
            {leaveRequest?.supporting_document && (
              <TouchableOpacity style={styles.documentItem}>
                <Icon name="paperclip" type="feather" size={16} color={Colors.primaryBlue500} />
                <Text style={styles.documentText}>View Supporting Document</Text>
              </TouchableOpacity>
            )}
            {leaveRequest?.rejection_reason && (
              <View style={styles.rejectionReason}>
                <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                <Text style={styles.rejectionText}>{leaveRequest.rejection_reason}</Text>
              </View>
            )}
            {leaveRequest?.rejected_by && (
              <View style={styles.rejectionInfo}>
                <Text style={styles.rejectionLabel}>
                  Rejected by: {leaveRequest.rejected_by_name}
                </Text>
                {leaveRequest.rejected_date && (
                  <Text style={styles.rejectionDate}>
                    on {formatDateTime(leaveRequest.rejected_date)}
                  </Text>
                )}
              </View>
            )}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primaryBlue500,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  leaveType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  shareButton: {
    padding: Layout.spacing.xs,
  },
  content: {
    padding: Layout.spacing.lg,
  },
  infoSection: {
    gap: Layout.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: Layout.spacing.sm,
    marginRight: Layout.spacing.xs,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: Layout.spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.md,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  timelineStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  timelineComments: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  actions: {
    gap: Layout.spacing.sm,
  },
  actionButton: {
    marginBottom: Layout.spacing.xs,
  },
  additionalInfo: {
    gap: Layout.spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
  },
  documentText: {
    fontSize: 14,
    color: Colors.primaryBlue500,
    marginLeft: Layout.spacing.sm,
  },
  rejectionReason: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.danger50,
    borderRadius: Layout.borderRadius.md,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.danger600,
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  rejectionInfo: {
    padding: Layout.spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
  },
  rejectionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});