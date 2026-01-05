// components/payroll/PayslipCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export interface Payslip {
  id: string;
  period: string;
  issueDate: string;
  netPay: number;
  currency: string;
  status: 'paid' | 'pending' | 'processing';
  downloadUrl?: string;
  viewUrl?: string;
}

export interface PayslipCardProps {
  payslip: Payslip;
  onDownload?: () => void;
  onView?: () => void;
  onShare?: () => void;
}

export const PayslipCard: React.FC<PayslipCardProps> = ({
  payslip,
  onDownload,
  onView,
  onShare,
}) => {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: payslip.currency || 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.period, { color: colors.text }]}>
            {payslip.period}
          </Text>
          <Text style={[styles.issueDate, { color: colors.textSecondary }]}>
            Issued: {new Date(payslip.issueDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payslip.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(payslip.status) }]}>
            {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
          Net Pay
        </Text>
        <Text style={[styles.amount, { color: colors.primary }]}>
          {formatCurrency(payslip.netPay)}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        {onView && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
            onPress={onView}
          >
            <Icon name="eye" type="feather" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              View
            </Text>
          </TouchableOpacity>
        )}

        {onDownload && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary + '10' }]}
            onPress={onDownload}
          >
            <Icon name="download" type="feather" size={18} color={colors.secondary} />
            <Text style={[styles.actionText, { color: colors.secondary }]}>
              Download
            </Text>
          </TouchableOpacity>
        )}

        {onShare && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success + '10' }]}
            onPress={onShare}
          >
            <Icon name="share-2" type="feather" size={18} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>
              Share
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
  },
  period: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  issueDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.round,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: Layout.spacing.xs,
  },
});