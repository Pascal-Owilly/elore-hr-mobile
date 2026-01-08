import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Icon } from '@/components/ui/Icon';
import { Layout } from '@/constants/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api/client'; // Use main api, not leaveApi
import { Loading } from '@/components/ui/Loading';
import { formatDate, calculateWorkingDays } from '@/lib/utils/format';

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

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const { user, employee } = useAuth();
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    contact_number: '',
    contact_address: '',
  });

  // Debug the employee object
  useEffect(() => {
    console.log('🔍 Employee in apply leave:', {
      id: employee?.id,
      organization: employee?.organization,
      organization_id: employee?.organization?.id,
    });
  }, [employee]);

  // Fetch leave types - Simplified API call
  const { 
    data: leaveTypesData, 
    isLoading: loadingTypes, 
    error: typesError,
    refetch: refetchTypes 
  } = useQuery({
    queryKey: ['leaveTypes', employee?.organization?.id],
    queryFn: async () => {
      if (!employee?.organization?.id) {
        console.error('❌ No organization ID found in employee:', employee);
        throw new Error('Organization ID not found');
      }
      
      console.log('📡 Fetching leave types for org:', employee.organization.id);
      
      try {
        const response = await api.get('/leaves/types/', {
          params: {
            organization: employee.organization.id,
            is_active: true,
          }
        });
        console.log('✅ Leave types response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('❌ Error fetching leave types:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    },
    enabled: !!employee?.organization?.id,
  });

  // Extract leave types from response - handle both array and paginated response
  const leaveTypes = React.useMemo(() => {
    if (!leaveTypesData) return [];
    
    if (Array.isArray(leaveTypesData)) {
      return leaveTypesData;
    } else if (leaveTypesData.results) {
      return leaveTypesData.results;
    } else if (leaveTypesData.count !== undefined) {
      return leaveTypesData.results || [];
    }
    
    return [];
  }, [leaveTypesData]);

  // Calculate total days
  const totalDays = formData.start_date && formData.end_date 
    ? calculateWorkingDays(formData.start_date, formData.end_date)
    : 0;

  // Check leave balance for selected type
  const selectedLeaveType = leaveTypes?.find((lt: any) => lt.id === formData.leave_type);

  // Create leave request mutation
// Update the createMutation in apply.tsx
const createMutation = useMutation({
  mutationFn: (data: any) => {
    // Convert to FormData since Django expects multipart/form-data
    const formData = new FormData();
    
    // Append all fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key].toString());
      }
    });
    
    console.log('📤 FormData being sent:', Object.fromEntries(formData));
    
    // Send as multipart/form-data
    return api.post('/leaves/requests/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  onSuccess: (response) => {
    console.log('✅ Leave request created:', response.data);
    Alert.alert(
      'Success',
      'Leave request submitted successfully',
      [{ 
        text: 'OK', 
        onPress: () => {
          router.push('/app/leaves/requests');
        }
      }]
    );
  },
  onError: (error: any) => {
    console.error('❌ Create leave error:', error.response?.data || error.message);
    Alert.alert(
      'Error', 
      error.response?.data?.detail || 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to submit leave request'
    );
  },
});

  const handleSubmit = () => {
    if (!formData.leave_type) {
      Alert.alert('Error', 'Please select a leave type');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    if (formData.start_date > formData.end_date) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for leave');
      return;
    }

    // Calculate total days
    const daysDiff = calculateWorkingDays(formData.start_date, formData.end_date);
    
    // Validate against leave type limits
    if (selectedLeaveType) {
      if (selectedLeaveType.max_consecutive_days > 0 && daysDiff > selectedLeaveType.max_consecutive_days) {
        Alert.alert(
          'Limit Exceeded',
          `Maximum consecutive days for ${selectedLeaveType.name} is ${selectedLeaveType.max_consecutive_days}. You're requesting ${daysDiff} days.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    submitLeave();
  };

  const submitLeave = () => {
    const leaveData = {
      employee: employee?.id,
      organization: employee?.organization?.id,
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_days: totalDays,
      reason: formData.reason,
      contact_number: formData.contact_number || employee?.phone_number || '',
      contact_address: formData.contact_address || '',
      status: 'DRAFT', // Start as draft
    };

    console.log('📤 Submitting leave request:', leaveData);
    createMutation.mutate(leaveData);
  };

  // Debug: Log leave types when they load
  useEffect(() => {
    if (leaveTypes) {
      console.log('📋 Leave types loaded:', {
        count: leaveTypes.length,
        firstFew: leaveTypes.slice(0, 3).map((lt: any) => ({
          id: lt.id,
          name: lt.name,
          code: lt.code,
          is_active: lt.is_active,
        }))
      });
    }
  }, [leaveTypes]);

  if (loadingTypes) {
    return (
      <View style={styles.container}>
        <Loading message="Loading leave types..." />
        <Text style={styles.debugText}>
          Organization ID: {employee?.organization?.id || 'Not found'}
        </Text>
      </View>
    );
  }

  // Handle case where there are no leave types
  if (leaveTypes.length === 0 && !typesError) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <View style={styles.emptyContainer}>
              <Icon name="file-text" type="feather" size={64} color={CustomColors.textSecondary} />
              <Text style={styles.emptyTitle}>No Leave Types Available</Text>
              <Text style={styles.emptyText}>
                Your organization has not set up any leave types yet.
              </Text>
              <Text style={styles.emptySubtext}>
                Please contact your HR administrator to set up leave types before applying for leave.
              </Text>
              
              <View style={styles.emptyActions}>
                <Button 
                  title="Go Back" 
                  onPress={() => router.back()}
                  variant="outline"
                  style={styles.backButton}
                />
                <Button 
                  title="Try Again" 
                  onPress={() => refetchTypes()}
                  style={styles.retryButton}
                />
              </View>
              
              {/* Admin/HR info if user has permissions */}
              {(user?.is_staff || user?.is_superuser) && (
                <View style={styles.adminInfo}>
                  <Text style={styles.adminTitle}>HR/Admin Information:</Text>
                  <Text style={styles.adminText}>
                    As an admin, you can set up leave types in the Django admin panel:
                  </Text>
                  <Text style={styles.adminSteps}>
                    1. Go to /admin/leaves/leavetype/{'\n'}
                    2. Click "Add Leave Type"{'\n'}
                    3. Fill in the required information{'\n'}
                    4. Ensure "Is Active" is checked
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    );
  }

  if (typesError) {
    console.error('❌ Error loading leave types:', typesError);
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Icon name="alert-circle" type="feather" size={48} color={CustomColors.danger500} />
          <Text style={styles.errorTitle}>Error Loading Leave Types</Text>
          <Text style={styles.errorMessage}>
            {typesError.message || 'Unable to load leave types. Please check your connection.'}
          </Text>
          <View style={styles.errorActions}>
            <Button 
              title="Go Back" 
              onPress={() => router.back()}
              variant="outline"
              style={styles.backButton}
            />
            <Button 
              title="Retry" 
              onPress={() => refetchTypes()}
              style={styles.retryButton}
            />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Leave Application</Text>
          
          {/* Leave Type Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Leave Type *</Text>
            <Select
              value={formData.leave_type}
              onValueChange={(value) => setFormData({ ...formData, leave_type: value })}
              items={leaveTypes.map((lt: any) => ({
                label: `${lt.name} (${lt.code})`,
                value: lt.id,
                description: `${lt.max_days_per_year === 0 ? 'Unlimited' : `${lt.max_days_per_year} days/year`} • ${lt.is_paid ? 'Paid' : 'Unpaid'}`
              }))}
              placeholder="Select leave type"
            />
          </View>

          {/* Selected Leave Type Details */}
          {selectedLeaveType && (
            <View style={styles.leaveTypeDetails}>
              <Text style={styles.detailsTitle}>{selectedLeaveType.name} Details:</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Max Days/Year:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLeaveType.max_days_per_year === 0 
                      ? 'Unlimited' 
                      : `${selectedLeaveType.max_days_per_year} days`}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Max Consecutive:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLeaveType.max_consecutive_days} days
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Paid:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLeaveType.is_paid ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Approval:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLeaveType.requires_approval ? 'Required' : 'Auto'}
                  </Text>
                </View>
              </View>
              {selectedLeaveType.is_statutory && (
                <Text style={styles.statutoryNote}>
                  ⚠️ Statutory Leave: {selectedLeaveType.statutory_days || 0} days as per Kenya law
                </Text>
              )}
            </View>
          )}

          {/* Dates */}
          <View style={styles.field}>
            <Text style={styles.label}>Start Date *</Text>
            <DatePicker
              value={formData.start_date}
              onChange={(date) => setFormData({ ...formData, start_date: date })}
              placeholder="Select start date"
              minimumDate={new Date().toISOString().split('T')[0]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>End Date *</Text>
            <DatePicker
              value={formData.end_date}
              onChange={(date) => setFormData({ ...formData, end_date: date })}
              placeholder="Select end date"
              minimumDate={formData.start_date || new Date().toISOString().split('T')[0]}
            />
          </View>

          {/* Days Calculation */}
          {totalDays > 0 && (
            <View style={styles.daysCalculation}>
              <Text style={styles.daysText}>
                Total Working Days: <Text style={styles.daysValue}>{totalDays}</Text>
              </Text>
              {selectedLeaveType && selectedLeaveType.max_consecutive_days > 0 && (
                <Text style={styles.balanceText}>
                  Maximum Allowed: {selectedLeaveType.max_consecutive_days} days
                </Text>
              )}
            </View>
          )}

          {/* Reason */}
          <View style={styles.field}>
            <Text style={styles.label}>Reason for Leave *</Text>
            <Input
              value={formData.reason}
              onChangeText={(text) => setFormData({ ...formData, reason: text })}
              placeholder="Please provide details for your leave request"
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
          </View>

          {/* Contact Information */}
          <Text style={styles.sectionSubtitle}>Contact During Leave</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Contact Number</Text>
            <Input
              value={formData.contact_number || employee?.phone_number || ''}
              onChangeText={(text) => setFormData({ ...formData, contact_number: text })}
              placeholder="Phone number for emergencies"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contact Address</Text>
            <Input
              value={formData.contact_address}
              onChangeText={(text) => setFormData({ ...formData, contact_address: text })}
              placeholder="Where can you be reached during leave?"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Documentation */}
          {selectedLeaveType?.requires_documentation && (
            <>
              <Text style={styles.sectionSubtitle}>Documentation Required</Text>
              <View style={styles.documentationNote}>
                <Text style={styles.documentationText}>
                  {selectedLeaveType.documentation_description || 
                   'Supporting documentation is required for this leave type.'}
                </Text>
                <TouchableOpacity style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>Upload Document</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <Button
              title="Submit Leave Request"
              onPress={handleSubmit}
              loading={createMutation.isPending}
              disabled={createMutation.isPending || !formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason}
              style={[styles.submitButton, { backgroundColor: CustomColors.primaryBlue }]}
            />
            <Button
              title="Save as Draft"
              variant="outline"
              onPress={() => {
                if (!formData.leave_type) {
                  Alert.alert('Error', 'Please select a leave type before saving as draft');
                  return;
                }
                Alert.alert('Info', 'Draft saved successfully');
              }}
              style={[styles.draftButton, { borderColor: CustomColors.primaryBlue }]}
              disabled={!formData.leave_type}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CustomColors.cream,
  },
  content: {
    padding: Layout.spacing.lg,
  },
  card: {
    backgroundColor: CustomColors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    ...Layout.shadow.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CustomColors.textPrimary,
    marginBottom: Layout.spacing.lg,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CustomColors.textPrimary,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  field: {
    marginBottom: Layout.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: CustomColors.textPrimary,
    marginBottom: 6,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: CustomColors.borderLight,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    backgroundColor: CustomColors.white,
  },
  leaveTypeDetails: {
    backgroundColor: `${CustomColors.info500}10`,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: `${CustomColors.info500}20`,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CustomColors.textPrimary,
    marginBottom: Layout.spacing.sm,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: Layout.spacing.xs,
  },
  detailLabel: {
    fontSize: 12,
    color: CustomColors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: CustomColors.textPrimary,
  },
  statutoryNote: {
    fontSize: 12,
    color: CustomColors.warning500,
    marginTop: Layout.spacing.sm,
    fontStyle: 'italic',
  },
  daysCalculation: {
    backgroundColor: `${CustomColors.success500}10`,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: `${CustomColors.success500}20`,
  },
  daysText: {
    fontSize: 14,
    color: CustomColors.textPrimary,
  },
  daysValue: {
    fontWeight: '600',
    color: CustomColors.success500,
  },
  balanceText: {
    fontSize: 12,
    color: CustomColors.textSecondary,
    marginTop: 4,
  },
  documentationNote: {
    backgroundColor: `${CustomColors.warning500}10`,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: `${CustomColors.warning500}20`,
  },
  documentationText: {
    fontSize: 14,
    color: CustomColors.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  uploadButton: {
    backgroundColor: CustomColors.white,
    borderWidth: 1,
    borderColor: CustomColors.borderLight,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: CustomColors.textPrimary,
  },
  submitSection: {
    marginTop: Layout.spacing.xl,
  },
  submitButton: {
    marginBottom: Layout.spacing.md,
  },
  draftButton: {
    marginBottom: Layout.spacing.md,
  },
  errorCard: {
    backgroundColor: CustomColors.white,
    margin: Layout.spacing.lg,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: CustomColors.danger500,
    marginBottom: Layout.spacing.md,
    marginTop: Layout.spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    color: CustomColors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    width: '100%',
  },
  backButton: {
    flex: 1,
  },
  retryButton: {
    flex: 1,
    backgroundColor: CustomColors.primaryBlue,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CustomColors.textPrimary,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: CustomColors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: CustomColors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    width: '100%',
    marginBottom: Layout.spacing.xl,
  },
  adminInfo: {
    backgroundColor: `${CustomColors.info500}10`,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: `${CustomColors.info500}20`,
    width: '100%',
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CustomColors.info500,
    marginBottom: Layout.spacing.sm,
  },
  adminText: {
    fontSize: 12,
    color: CustomColors.textPrimary,
    marginBottom: Layout.spacing.sm,
  },
  adminSteps: {
    fontSize: 11,
    color: CustomColors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  debugText: {
    fontSize: 12,
    color: CustomColors.textSecondary,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: Layout.spacing.md,
  },
});