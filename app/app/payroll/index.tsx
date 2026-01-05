import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { KenyaConstants } from '@constants/KenyaConstants';
import { Icon } from '@components/ui/Icon';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { PayPeriodSelector } from '@components/payroll/PayPeriodSelector';
import { PayslipCard } from '@components/payroll/PayslipCard';
import { StatutoryBreakdown } from '@components/payroll/StatutoryBreakdown';
import { EarningsCard } from '@components/payroll/EarningsCard';
import { DeductionsCard } from '@components/payroll/DeductionsCard';
import { MpesaStatus } from '@components/payroll/MpesaStatus';
import { api } from '@lib/api/client';
import { useAuth } from '@lib/hooks/useAuth';

export default function PayrollScreen() {
  const { employee } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Fetch payroll periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: async () => {
      const response = await api.get('/payroll/periods/');
      return response.data;
    },
  });

  // Fetch payroll for selected period
  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', selectedPeriod],
    queryFn: async () => {
      if (!selectedPeriod) return null;
      const response = await api.get(`/payroll/${selectedPeriod}/`);
      return response.data;
    },
    enabled: !!selectedPeriod,
  });

  // Fetch recent payrolls
  const { data: recentPayrolls, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-payrolls'],
    queryFn: async () => {
      const response = await api.get('/payroll/recent/');
      return response.data;
    },
  });

  // Set default selected period to current month if available
  React.useEffect(() => {
    if (periods && periods.length > 0 && !selectedPeriod) {
      const currentPeriod = periods.find(
        (p: any) => p.status === 'PAID' || p.status === 'APPROVED'
      );
      if (currentPeriod) {
        setSelectedPeriod(currentPeriod.id);
      }
    }
  }, [periods]);

  const handleViewPayslip = (payrollId: string) => {
    router.push(`/(app)/payroll/${payrollId}`);
  };

  const handleDownloadPayslip = async (payrollId: string) => {
    try {
      const response = await api.get(`/payroll/${payrollId}/payslip/`, {
        responseType: 'blob',
      });
      // Handle PDF download
      // Implementation depends on your file handling setup
    } catch (error) {
      console.error('Failed to download payslip:', error);
    }
  };

  const handleMpesaPayment = async () => {
    if (!payrollData) return;
    
    try {
      // Initiate M-Pesa payment
      const response = await api.post('/payroll/mpesa-payment/', {
        payroll_id: payrollData.id,
      });
      
      // Show success message
      Alert.alert(
        'Payment Initiated',
        'M-Pesa payment request sent. Please check your phone.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('M-Pesa payment failed:', error);
      Alert.alert('Payment Failed', 'Unable to process M-Pesa payment.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payroll</Text>
          <Text style={styles.subtitle}>
            View your payslips and payment history
          </Text>
        </View>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => {
            if (payrollData) {
              handleDownloadPayslip(payrollData.id);
            }
          }}
          disabled={!payrollData}
        >
          <Icon name="download" size={20} color={Colors.primaryBlue600} />
        </TouchableOpacity>
      </View>

      {/* Kenya Flag Line */}
      <View style={styles.flagLine}>
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaBlack }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaRed }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaGreen }]} />
        <View style={[styles.flagSegment, { backgroundColor: Colors.kenyaWhite }]} />
      </View>

      {/* Pay Period Selector */}
      <PayPeriodSelector
        periods={periods}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        loading={periodsLoading}
      />

      {selectedPeriod && payrollData && (
        <>
          {/* Main Payslip Card */}
          <PayslipCard
            payroll={payrollData}
            onViewDetails={() => handleViewPayslip(payrollData.id)}
          />

          {/* Payment Status */}
          {payrollData.payment_status === 'PAID' && payrollData.mpesa_transaction_id && (
            <MpesaStatus
              transactionId={payrollData.mpesa_transaction_id}
              paymentDate={payrollData.payment_date}
              amount={payrollData.net_salary}
            />
          )}

          {/* Payment Action */}
          {payrollData.payment_status === 'APPROVED' && employee?.mpesa_number && (
            <Card style={styles.paymentActionCard}>
              <View style={styles.paymentActionHeader}>
                <Icon name="smartphone" size={24} color={Colors.gold500} />
                <Text style={styles.paymentActionTitle}>
                  Ready for M-Pesa Payment
                </Text>
              </View>
              <Text style={styles.paymentActionText}>
                Your salary of {KenyaConstants.currency.format(payrollData.net_salary)} is ready for payment to:
              </Text>
              <Text style={styles.mpesaNumber}>
                {KenyaConstants.phoneFormat.display(employee.mpesa_number || '')}
              </Text>
              <Button
                title="Pay via M-Pesa"
                onPress={handleMpesaPayment}
                style={styles.mpesaButton}
                icon={<Icon name="smartphone" size={20} color={Colors.white} />}
              />
            </Card>
          )}

          {/* Earnings Breakdown */}
          <EarningsCard earnings={payrollData.earnings} />

          {/* Statutory Deductions (Kenya Specific) */}
          <StatutoryBreakdown
            nssf={payrollData.nssf_employee}
            nhif={payrollData.nhif}
            paye={payrollData.paye}
            helb={payrollData.helb}
            totalDeductions={payrollData.total_deductions}
          />

          {/* Other Deductions */}
          <DeductionsCard deductions={payrollData.other_deductions} />

          {/* Net Salary Summary */}
          <Card style={styles.netSalaryCard}>
            <View style={styles.netSalaryHeader}>
              <Text style={styles.netSalaryTitle}>Net Salary</Text>
              <Text style={styles.netSalaryAmount}>
                {KenyaConstants.currency.format(payrollData.net_salary)}
              </Text>
            </View>
            <View style={styles.netSalaryBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Gross Salary</Text>
                <Text style={styles.breakdownValue}>
                  {KenyaConstants.currency.format(payrollData.gross_salary)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Total Deductions</Text>
                <Text style={[styles.breakdownValue, styles.deductionValue]}>
                  -{KenyaConstants.currency.format(payrollData.total_deductions)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.netSalaryLabel}>Net Payable</Text>
                <Text style={styles.netSalaryValue}>
                  {KenyaConstants.currency.format(payrollData.net_salary)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Payment Method */}
          <Card style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodHeader}>
              <Icon name="credit-card" size={20} color={Colors.primaryBlue500} />
              <Text style={styles.paymentMethodTitle}>Payment Method</Text>
            </View>
            <View style={styles.paymentMethodContent}>
              <Icon
                name={payrollData.payment_method === 'MPESA' ? 'smartphone' : 'bank'}
                size={32}
                color={Colors.primaryBlue500}
              />
              <View>
                <Text style={styles.paymentMethodText}>
                  {payrollData.payment_method === 'MPESA' ? 'M-Pesa' : 'Bank Transfer'}
                </Text>
                {payrollData.payment_method === 'MPESA' && employee?.mpesa_number && (
                  <Text style={styles.paymentMethodDetail}>
                    {KenyaConstants.phoneFormat.display(employee.mpesa_number)}
                  </Text>
                )}
                {payrollData.payment_method === 'BANK' && (
                  <Text style={styles.paymentMethodDetail}>
                    {employee?.bank_account_number} • {employee?.bank_name}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </>
      )}

      {/* Recent Payrolls */}
      {recentPayrolls && recentPayrolls.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payslips</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/payroll/history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentPayrolls.slice(0, 3).map((payroll: any) => (
            <TouchableOpacity
              key={payroll.id}
              style={styles.recentPayslip}
              onPress={() => handleViewPayslip(payroll.id)}
            >
              <View style={styles.recentPayslipInfo}>
                <Text style={styles.recentPeriod}>{payroll.period_name}</Text>
                <Text style={styles.recentDate}>
                  Paid on {dayjs(payroll.payment_date).format('DD/MM/YYYY')}
                </Text>
              </View>
              <View style={styles.recentAmountContainer}>
                <Text style={styles.recentAmount}>
                  {KenyaConstants.currency.format(payroll.net_salary)}
                </Text>
                <Icon name="chevron-right" size={20} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Kenya Tax Information */}
      <Card style={styles.taxInfoCard}>
        <View style={styles.taxInfoHeader}>
          <Icon name="info" size={20} color={Colors.info500} />
          <Text style={styles.taxInfoTitle}>Kenya Tax Information</Text>
        </View>
        <Text style={styles.taxInfoText}>
          Your payroll deductions comply with Kenya Revenue Authority (KRA) regulations. 
          PAYE is calculated based on graduated tax bands, with personal relief of KSh 2,400 per month.
        </Text>
        <TouchableOpacity
          style={styles.taxInfoButton}
          onPress={() => router.push('/(app)/payroll/tax-info')}
        >
          <Text style={styles.taxInfoButtonText}>Learn about Kenya taxes</Text>
          <Icon name="external-link" size={16} color={Colors.primaryBlue500} />
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
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
  downloadButton: {
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
  paymentActionCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  paymentActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  paymentActionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentActionText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  mpesaNumber: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.gold600,
    marginBottom: Layout.spacing.md,
  },
  mpesaButton: {
    backgroundColor: Colors.gold500,
  },
  netSalaryCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  netSalaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  netSalaryTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  netSalaryAmount: {
    fontSize: Layout.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.success500,
  },
  netSalaryBreakdown: {
    gap: Layout.spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  deductionValue: {
    color: Colors.danger500,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Layout.spacing.sm,
  },
  netSalaryLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  netSalaryValue: {
    fontSize: Layout.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.success500,
  },
  paymentMethodCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  paymentMethodTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  paymentMethodText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentMethodDetail: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  recentSection: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewAllText: {
    color: Colors.primaryBlue600,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  recentPayslip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recentPayslipInfo: {
    flex: 1,
  },
  recentPeriod: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  recentDate: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  recentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  recentAmount: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.success500,
  },
  taxInfoCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  taxInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  taxInfoTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  taxInfoText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Layout.lineHeight.normal,
    marginBottom: Layout.spacing.md,
  },
  taxInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  taxInfoButtonText: {
    color: Colors.primaryBlue600,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});