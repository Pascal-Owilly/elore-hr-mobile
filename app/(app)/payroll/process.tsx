// app/app/payroll/process.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Layout } from '@/constants/Layout';
import { KenyaConstants } from '@constants/KenyaConstants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

const THEME_COLORS = {
  cream: '#e9ded3',
  primaryBlue: '#0056b3',
  gold: '#deab63',
  white: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  borderLight: '#e5e7eb',
  background: '#f9fafb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
};

interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_locked: boolean;
}

interface Payroll {
  id: string;
  employee: {
    id: string;
    employee_number: string;
    user: {
      first_name: string;
      last_name: string;
    };
    mpesa_number?: string;
    bank_account_number?: string;
    bank_name?: string;
  };
  gross_salary: number;
  net_salary: number;
  payment_status: string;
  payment_method: string;
  payment_date?: string;
}

export default function ProcessPaymentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(params.periodId as string || null);
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'MPESA' | 'CASH'>('BANK');
  const [refreshing, setRefreshing] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);

  // Fetch payroll periods
  const { 
    data: periods, 
    isLoading: periodsLoading,
    refetch: refetchPeriods 
  } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: async () => {
      const response = await api.get('/payroll/periods/');
      return response.data;
    },
  });

  // Fetch calculated payrolls for selected period
  const { 
    data: calculatedPayrolls, 
    isLoading: payrollsLoading,
    refetch: refetchPayrolls 
  } = useQuery({
    queryKey: ['calculated-payrolls', selectedPeriod],
    queryFn: async () => {
      if (!selectedPeriod) return [];
      const response = await api.get('/payroll/list/', {
        params: {
          period_id: selectedPeriod,
          status: 'CALCULATED,APPROVED'
        }
      });
      return response.data.results || [];
    },
    enabled: !!selectedPeriod,
  });

  // Process payments mutation
  const processMutation = useMutation({
    mutationFn: async (data: { period_id: string; payment_method: string; send_notifications: boolean }) => {
      const response = await api.post('/payroll/process/', data);
      return response.data;
    },
    onSuccess: (data) => {
      Alert.alert(
        'Success',
        `Processed ${data.results.length} payments`,
        [
          { 
            text: 'View Results', 
            onPress: () => {
              // Navigate to payroll details or summary
              router.push('/app/payroll');
            }
          },
          { 
            text: 'Process More', 
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ['calculated-payrolls', selectedPeriod] });
              queryClient.invalidateQueries({ queryKey: ['payroll-dashboard'] });
            }
          }
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to process payments');
    }
  });

  // M-Pesa payment mutation
  const mpesaMutation = useMutation({
    mutationFn: async (payrollId: string) => {
      const response = await api.post('/payroll/mpesa-payment/', { payroll_id: payrollId });
      return response.data;
    },
    onSuccess: (data, payrollId) => {
      Alert.alert('Success', 'M-Pesa payment initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['calculated-payrolls', selectedPeriod] });
    },
    onError: (error: any, payrollId) => {
      Alert.alert('Error', error.message || 'Failed to process M-Pesa payment');
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPeriods(), refetchPayrolls()]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return KenyaConstants.currency.format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'MPESA':
        return 'smartphone';
      case 'BANK':
        return 'credit-card';
      case 'CASH':
        return 'dollar-sign';
      default:
        return 'credit-card';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'MPESA':
        return 'M-Pesa';
      case 'BANK':
        return 'Bank Transfer';
      case 'CASH':
        return 'Cash';
      default:
        return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CALCULATED':
        return THEME_COLORS.info;
      case 'APPROVED':
        return THEME_COLORS.success;
      case 'PAID':
        return THEME_COLORS.primaryBlue;
      default:
        return THEME_COLORS.textSecondary;
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!calculatedPayrolls) return { count: 0, total: 0, average: 0 };
    
    const count = calculatedPayrolls.length;
    const total = calculatedPayrolls.reduce((sum: number, payroll: Payroll) => sum + Number(payroll.net_salary), 0);
    const average = count > 0 ? total / count : 0;
    
    return { count, total, average };
  };

  const totals = calculateTotals();

  // Handle bulk process
  const handleBulkProcess = () => {
    if (!selectedPeriod) {
      Alert.alert('Error', 'Please select a payroll period');
      return;
    }

    if (calculatedPayrolls?.length === 0) {
      Alert.alert('Error', 'No calculated payrolls found for this period');
      return;
    }

    Alert.alert(
      'Process Payments',
      `Process ${calculatedPayrolls?.length || 0} payments via ${getPaymentMethodText(paymentMethod)}? Total amount: ${formatCurrency(totals.total)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Process', 
          onPress: () => {
            processMutation.mutate({
              period_id: selectedPeriod,
              payment_method: paymentMethod,
              send_notifications: sendNotifications
            });
          }
        }
      ]
    );
  };

  // Handle individual M-Pesa payment
  const handleIndividualMpesa = (payroll: Payroll) => {
    if (!payroll.employee.mpesa_number) {
      Alert.alert('Error', 'Employee does not have an M-Pesa number registered');
      return;
    }

    Alert.alert(
      'Send M-Pesa Payment',
      `Send ${formatCurrency(payroll.net_salary)} to ${payroll.employee.mpesa_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            mpesaMutation.mutate(payroll.id);
          }
        }
      ]
    );
  };

  const isLoading = periodsLoading || payrollsLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading payroll data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[THEME_COLORS.primaryBlue]}
          tintColor={THEME_COLORS.primaryBlue}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={THEME_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Process Payments</Text>
      </View>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Employees</Text>
            <Text style={styles.summaryValue}>{totals.count}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totals.total)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Average</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totals.average)}</Text>
          </View>
        </View>
      </Card>

      {/* Period Selection */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Payroll Period</Text>
        <Text style={styles.sectionSubtitle}>Select period to process payments</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodsScrollContent}
        >
          {periods?.map((period: PayrollPeriod) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodCard,
                selectedPeriod === period.id && styles.periodCardSelected,
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodName,
                selectedPeriod === period.id && styles.periodNameSelected,
              ]}>
                {period.name}
              </Text>
              
              <Text style={styles.periodDate}>
                {formatDate(period.start_date)} - {formatDate(period.end_date)}
              </Text>
              
              <View style={styles.periodStatusRow}>
                <View style={[
                  styles.periodStatus,
                  { backgroundColor: getStatusColor(period.status) }
                ]}>
                  <Text style={styles.periodStatusText}>
                    {period.status}
                  </Text>
                </View>
                <Text style={styles.periodEmployees}>
                  {period.status === 'CALCULATED' ? 'Ready to pay' : 'Not calculated'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {/* Payment Method Selection */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Text style={styles.sectionSubtitle}>Choose how to send payments</Text>
        
        <SegmentedControl
          segments={[
            { label: 'Bank Transfer', value: 'BANK' },
            { label: 'M-Pesa', value: 'MPESA' },
            { label: 'Cash', value: 'CASH' },
          ]}
          selectedValue={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as any)}
          style={styles.paymentMethodControl}
        />
        
        <View style={styles.notificationToggle}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setSendNotifications(!sendNotifications)}
          >
            <View style={[
              styles.checkbox,
              sendNotifications && styles.checkboxChecked
            ]}>
              {sendNotifications && (
                <Feather name="check" size={14} color={THEME_COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Send payment notifications to employees
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Payroll List */}
      {selectedPeriod && calculatedPayrolls && calculatedPayrolls.length > 0 && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payroll to Process</Text>
            <Text style={styles.sectionCount}>
              {calculatedPayrolls.length} employees
            </Text>
          </View>
          
          <View style={styles.payrollList}>
            {calculatedPayrolls.map((payroll: Payroll) => (
              <View key={payroll.id} style={styles.payrollItem}>
                <View style={styles.payrollInfo}>
                  <Text style={styles.employeeName}>
                    {payroll.employee.user.first_name} {payroll.employee.user.last_name}
                  </Text>
                  <Text style={styles.employeeNumber}>
                    {payroll.employee.employee_number}
                  </Text>
                  
                  <View style={styles.paymentDetails}>
                    <Text style={styles.paymentMethod}>
                      {getPaymentMethodText(payroll.payment_method)}
                    </Text>
                    {payroll.employee.mpesa_number && (
                      <Text style={styles.paymentAccount}>
                        {payroll.employee.mpesa_number}
                      </Text>
                    )}
                    {payroll.employee.bank_account_number && (
                      <Text style={styles.paymentAccount}>
                        {payroll.employee.bank_name}: {payroll.employee.bank_account_number}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.payrollActions}>
                  <Text style={styles.payrollAmount}>
                    {formatCurrency(payroll.net_salary)}
                  </Text>
                  
                  <View style={styles.actionButtons}>
                    {payroll.payment_method === 'MPESA' && (
                      <TouchableOpacity
                        onPress={() => handleIndividualMpesa(payroll)}
                        style={styles.individualPaymentButton}
                        disabled={mpesaMutation.isPending}
                      >
                        <Feather name="send" size={16} color={THEME_COLORS.white} />
                        <Text style={styles.individualPaymentText}>Send M-Pesa</Text>
                      </TouchableOpacity>
                    )}
                    
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(payroll.payment_status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(payroll.payment_status) }
                      ]}>
                        {payroll.payment_status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
        
        <Button
          title={`Process ${calculatedPayrolls?.length || 0} Payments`}
          onPress={handleBulkProcess}
          disabled={!selectedPeriod || calculatedPayrolls?.length === 0 || processMutation.isPending}
          loading={processMutation.isPending}
          icon="send"
          style={styles.processButton}
        />
      </View>

      {/* Information Card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Feather name="info" size={20} color={THEME_COLORS.info} />
          <Text style={styles.infoTitle}>Payment Processing Information</Text>
        </View>
        
        <Text style={styles.infoText}>
          • Bank transfers: Payments are marked as paid and reference numbers generated{'\n'}
          • M-Pesa payments: Real-time processing with transaction tracking{'\n'}
          • Cash payments: Marked as paid for reconciliation{'\n'}
          • Notifications: Employees receive SMS/email notifications when enabled{'\n'}
          • Payment records are logged for audit purposes
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.cream,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.primaryBlue,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.lg,
  },
  backButton: {
    marginRight: Layout.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.white,
  },
  summaryCard: {
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.textPrimary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: THEME_COLORS.borderLight,
  },
  section: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
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
    color: THEME_COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.primaryBlue,
  },
  periodsScrollContent: {
    gap: Layout.spacing.md,
  },
  periodCard: {
    width: 220,
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    borderWidth: 2,
    borderColor: THEME_COLORS.borderLight,
  },
  periodCardSelected: {
    borderColor: THEME_COLORS.primaryBlue,
    backgroundColor: THEME_COLORS.primaryBlue + '10',
  },
  periodName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  periodNameSelected: {
    color: THEME_COLORS.primaryBlue,
  },
  periodDate: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  periodStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodStatus: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.white,
    textTransform: 'uppercase',
  },
  periodEmployees: {
    fontSize: 12,
    color: THEME_COLORS.textTertiary,
  },
  paymentMethodControl: {
    marginBottom: Layout.spacing.md,
  },
  notificationToggle: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.borderLight,
    paddingTop: Layout.spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
    marginRight: Layout.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: THEME_COLORS.primaryBlue,
    borderColor: THEME_COLORS.primaryBlue,
  },
  checkboxLabel: {
    fontSize: 14,
    color: THEME_COLORS.textPrimary,
  },
  payrollList: {
    gap: Layout.spacing.md,
  },
  payrollItem: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payrollInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: 2,
  },
  employeeNumber: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  paymentDetails: {
    gap: 2,
  },
  paymentMethod: {
    fontSize: 14,
    color: THEME_COLORS.textPrimary,
    fontWeight: '500',
  },
  paymentAccount: {
    fontSize: 12,
    color: THEME_COLORS.textTertiary,
  },
  payrollActions: {
    alignItems: 'flex-end',
  },
  payrollAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.success,
    marginBottom: Layout.spacing.sm,
  },
  actionButtons: {
    alignItems: 'flex-end',
    gap: Layout.spacing.xs,
  },
  individualPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.success,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 6,
    gap: Layout.spacing.xs,
  },
  individualPaymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  processButton: {
    flex: 2,
  },
  infoCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
    backgroundColor: THEME_COLORS.info + '10',
    borderColor: THEME_COLORS.info + '30',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    lineHeight: 20,
  },
});