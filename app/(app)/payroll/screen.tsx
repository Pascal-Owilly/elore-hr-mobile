import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Layout } from '@/constants/Layout';
import { KenyaConstants } from '@constants/KenyaConstants';
import dayjs from 'dayjs';

// Theme colors
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
  pay_date: string;
  status: string;
  is_locked: boolean;
}

interface PayrollDashboard {
  summary: {
    total_payroll: number;
    total_gross: number;
    total_employees: number;
    average_salary: number;
    payroll_change: number;
    employee_change: number;
    avg_salary_change: number;
  };
}

export default function PayrollScreen() {
  const { user, employee } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

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

  // Fetch payroll dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading,
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: ['payroll-dashboard'],
    queryFn: async () => {
      const response = await api.get('/payroll/dashboard/');
      return response.data;
    },
  });

  // Fetch recent payslips
  const { 
    data: recentPayslips, 
    isLoading: recentPayslipsLoading,
    refetch: refetchRecentPayslips 
  } = useQuery({
    queryKey: ['recent-payslips'],
    queryFn: async () => {
      const response = await api.get('/payroll/my-payslips/');
      return response.data;
    },
  });

  // Set default selected period
  useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriod) {
      // Try to find current period or latest paid period
      const currentPeriod = periods.find(
        (p: PayrollPeriod) => 
          p.status === 'PAID' || 
          p.status === 'APPROVED' ||
          (dayjs(p.end_date).isAfter(dayjs().subtract(15, 'days')) && 
           dayjs(p.start_date).isBefore(dayjs()))
      );
      if (currentPeriod) {
        setSelectedPeriod(currentPeriod.id);
      }
    }
  }, [periods]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchPeriods(),
      refetchDashboard(),
      refetchRecentPayslips(),
    ]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return KenyaConstants.currency.format(amount);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return THEME_COLORS.success;
      case 'APPROVED':
        return THEME_COLORS.info;
      case 'PENDING':
        return THEME_COLORS.warning;
      case 'CALCULATED':
        return THEME_COLORS.primaryBlue;
      case 'FAILED':
        return THEME_COLORS.danger;
      default:
        return THEME_COLORS.textSecondary;
    }
  };

  const handleViewPayslip = (payrollId: string) => {
    router.push(`/(app)/payroll/${payrollId}`);
  };

  const handleGeneratePayslip = async (payrollId: string) => {
    try {
      Alert.alert(
        'Download Payslip',
        'Would you like to download the payslip as PDF?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Download', 
            onPress: async () => {
              const response = await api.get(`/payroll/${payrollId}/payslip-pdf/`);
              // Handle PDF download here
              Alert.alert('Success', 'Payslip PDF generated successfully');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate payslip');
    }
  };

  const handleCalculateStatutory = async () => {
    if (!employee?.basic_salary) {
      Alert.alert('Error', 'Basic salary not available');
      return;
    }

    try {
      const response = await api.post('/payroll/statutory/', {
        gross_salary: employee.basic_salary + (employee.housing_allowance || 0) + (employee.transport_allowance || 0),
        employment_type: employee.employment_type || 'PERMANENT',
        has_helb: !!employee.helb_deduction,
      });

      Alert.alert(
        'Statutory Calculation',
        `NSSF: ${formatCurrency(response.data.statutory_deductions.nssf_employee)}\n` +
        `NHIF: ${formatCurrency(response.data.statutory_deductions.nhif)}\n` +
        `PAYE: ${formatCurrency(response.data.statutory_deductions.paye)}\n` +
        `Net Salary: ${formatCurrency(response.data.net_salary)}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate statutory deductions');
    }
  };

  const isLoading = periodsLoading || dashboardLoading || recentPayslipsLoading;

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
        <View>
          <Text style={styles.title}>Payroll Dashboard</Text>
          <Text style={styles.subtitle}>
            {employee?.employee_number ? `Employee ID: ${employee.employee_number}` : 'Payroll Management'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.statutoryButton}
          onPress={handleCalculateStatutory}
        >
          <Feather name="calculator" size={20} color={THEME_COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      {dashboardData?.summary && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Feather name="users" size={20} color={THEME_COLORS.primaryBlue} />
            <Text style={styles.statValue}>
              {dashboardData.summary.total_employees}
            </Text>
            <Text style={styles.statLabel}>Total Employees</Text>
            {dashboardData.summary.employee_change !== 0 && (
              <View style={styles.statChange}>
                <Feather 
                  name={dashboardData.summary.employee_change > 0 ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={dashboardData.summary.employee_change > 0 ? THEME_COLORS.success : THEME_COLORS.danger} 
                />
                <Text style={[
                  styles.changeText,
                  { color: dashboardData.summary.employee_change > 0 ? THEME_COLORS.success : THEME_COLORS.danger }
                ]}>
                  {Math.abs(dashboardData.summary.employee_change)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statCard}>
            <Feather name="dollar-sign" size={20} color={THEME_COLORS.success} />
            <Text style={styles.statValue}>
              {formatCurrency(dashboardData.summary.total_payroll)}
            </Text>
            <Text style={styles.statLabel}>Total Payroll</Text>
            {dashboardData.summary.payroll_change !== 0 && (
              <View style={styles.statChange}>
                <Feather 
                  name={dashboardData.summary.payroll_change > 0 ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={dashboardData.summary.payroll_change > 0 ? THEME_COLORS.success : THEME_COLORS.danger} 
                />
                <Text style={[
                  styles.changeText,
                  { color: dashboardData.summary.payroll_change > 0 ? THEME_COLORS.success : THEME_COLORS.danger }
                ]}>
                  {Math.abs(dashboardData.summary.payroll_change)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statCard}>
            <Feather name="activity" size={20} color={THEME_COLORS.info} />
            <Text style={styles.statValue}>
              {formatCurrency(dashboardData.summary.average_salary)}
            </Text>
            <Text style={styles.statLabel}>Average Salary</Text>
            {dashboardData.summary.avg_salary_change !== 0 && (
              <View style={styles.statChange}>
                <Feather 
                  name={dashboardData.summary.avg_salary_change > 0 ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={dashboardData.summary.avg_salary_change > 0 ? THEME_COLORS.success : THEME_COLORS.danger} 
                />
                <Text style={[
                  styles.changeText,
                  { color: dashboardData.summary.avg_salary_change > 0 ? THEME_COLORS.success : THEME_COLORS.danger }
                ]}>
                  {Math.abs(dashboardData.summary.avg_salary_change)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Quick Actions - Horizontal Scroll */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsScrollContent}
        >
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(app)/payroll/calculate')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e8f4fd' }]}>
              <Feather name="calculator" size={24} color={THEME_COLORS.primaryBlue} />
            </View>
            <Text style={styles.actionText}>Calculate Payroll</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(app)/payroll/process')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ecfdf5' }]}>
              <Feather name="send" size={24} color={THEME_COLORS.success} />
            </View>
            <Text style={styles.actionText}>Process Payments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(app)/payroll/reports')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Feather name="bar-chart-2" size={24} color={THEME_COLORS.info} />
            </View>
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(app)/payroll/salary-structure')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fefce8' }]}>
              <Feather name="dollar-sign" size={24} color={THEME_COLORS.warning} />
            </View>
            <Text style={styles.actionText}>Salary Structure</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(app)/payroll/statutory-structure')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}>
              <Feather name="shield" size={24} color={THEME_COLORS.danger} />
            </View>
            <Text style={styles.actionText}>Statutory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(app)/payroll/settings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f5f3ff' }]}>
              <Feather name="settings" size={24} color={THEME_COLORS.primaryBlue} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* My Recent Payslips */}
      {recentPayslips && recentPayslips.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Recent Payslips</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/payroll/history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.payslipsList}>
            {recentPayslips.slice(0, 3).map((payslip: any) => (
              <TouchableOpacity
                key={payslip.id}
                style={styles.payslipCard}
                onPress={() => handleViewPayslip(payslip.id)}
              >
                <View style={styles.payslipHeader}>
                  <Text style={styles.payslipPeriod}>{payslip.period_name}</Text>
                  <Text style={styles.payslipAmount}>
                    {formatCurrency(payslip.net_salary)}
                  </Text>
                </View>
                
                <View style={styles.payslipDetails}>
                  <Text style={styles.payslipDate}>
                    {payslip.payment_date ? `Paid on ${formatDate(payslip.payment_date)}` : 'Not paid yet'}
                  </Text>
                  <View style={[
                    styles.payslipStatus,
                    { backgroundColor: getStatusColor(payslip.payment_status) + '20' }
                  ]}>
                    <Text style={[
                      styles.payslipStatusText,
                      { color: getStatusColor(payslip.payment_status) }
                    ]}>
                      {payslip.payment_status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.payslipFooter}>
                  <TouchableOpacity
                    onPress={() => handleGeneratePayslip(payslip.id)}
                    style={styles.downloadButton}
                  >
                    <Feather name="download" size={18} color={THEME_COLORS.primaryBlue} />
                    <Text style={styles.downloadText}>Download PDF</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Period Selector - Horizontal Scroll */}
      {periods && periods.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payroll Periods</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodsScrollContent}
          >
            {periods.map((period: PayrollPeriod) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodCard,
                  selectedPeriod === period.id && styles.periodCardSelected,
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <View style={styles.periodHeader}>
                  <Text style={[
                    styles.periodName,
                    selectedPeriod === period.id && styles.periodNameSelected,
                  ]}>
                    {period.name}
                  </Text>
                  {period.is_locked && (
                    <Feather name="lock" size={14} color={THEME_COLORS.warning} />
                  )}
                </View>
                
                <Text style={styles.periodDate}>
                  {formatDate(period.start_date)} - {formatDate(period.end_date)}
                </Text>
                
                <View style={[
                  styles.periodStatus,
                  { backgroundColor: getStatusColor(period.status) }
                ]}>
                  <Text style={styles.periodStatusText}>
                    {period.status}
                  </Text>
                </View>
                
                <Text style={styles.payDate}>
                  Pay Date: {formatDate(period.pay_date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Kenya Tax Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Feather name="info" size={20} color={THEME_COLORS.info} />
          <Text style={styles.infoTitle}>Kenya Tax Information</Text>
        </View>
        
        <Text style={styles.infoText}>
          • NSSF: 6% of pensionable pay (employee) + 6% (employer){'\n'}
          • NHIF: Based on salary tiers (KSh 150 - 1,700){'\n'}
          • PAYE: Graduated tax rates with KSh 2,400 personal relief{'\n'}
          • HELB: KSh 1,500 per month if applicable
        </Text>
        
        <TouchableOpacity
          style={styles.learnMoreButton}
          onPress={() => router.push('/app/payroll/tax-info')}
        >
          <Text style={styles.learnMoreText}>Learn more about Kenya taxes</Text>
          <Feather name="external-link" size={16} color={THEME_COLORS.primaryBlue} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.primaryBlue,
  },
  subtitle: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginTop: 4,
  },
  statutoryButton: {
    padding: 12,
    backgroundColor: THEME_COLORS.gold,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  viewAllText: {
    color: THEME_COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '500',
  },
  // Quick Actions Styles
  actionsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: 120,
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    textAlign: 'center',
  },
  // Payslips Styles
  payslipsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  payslipCard: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payslipPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    flex: 1,
  },
  payslipAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.success,
  },
  payslipDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payslipDate: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  payslipStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payslipStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  payslipFooter: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.gray100,
    paddingTop: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  downloadText: {
    color: THEME_COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '500',
  },
  // Periods Styles
  periodsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  periodCard: {
    width: CARD_WIDTH,
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  periodCardSelected: {
    borderColor: THEME_COLORS.primaryBlue,
    backgroundColor: THEME_COLORS.primaryBlue + '10',
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  periodNameSelected: {
    color: THEME_COLORS.primaryBlue,
  },
  periodDate: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 12,
  },
  periodStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  periodStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.white,
    textTransform: 'uppercase',
  },
  payDate: {
    fontSize: 14,
    color: THEME_COLORS.textPrimary,
    fontWeight: '500',
  },
  // Info Section
  infoSection: {
    backgroundColor: THEME_COLORS.info + '10',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME_COLORS.info + '30',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  learnMoreText: {
    color: THEME_COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '500',
  },
});