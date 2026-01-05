// components/payroll/MpesaStatus.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export interface MpesaTransaction {
  id: string;
  amount: number;
  phoneNumber: string;
  transactionDate: string;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  reference: string;
  description?: string;
}

export interface MpesaStatusProps {
  transaction?: MpesaTransaction;
  onViewDetails?: () => void;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export const MpesaStatus: React.FC<MpesaStatusProps> = ({
  transaction,
  onViewDetails,
  onRetry,
  onContactSupport,
}) => {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format Kenyan phone number: 0712345678 -> 0712 345 678
    if (phone.length === 10) {
      return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
    }
    return phone;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'successful':
        return {
          color: colors.success,
          icon: 'check-circle',
          iconType: 'feather' as const,
          title: 'Payment Successful',
          message: 'Your payment has been processed successfully.',
        };
      case 'pending':
        return {
          color: colors.warning,
          icon: 'clock',
          iconType: 'feather' as const,
          title: 'Payment Pending',
          message: 'Your payment is being processed. This may take a few minutes.',
        };
      case 'failed':
        return {
          color: colors.error,
          icon: 'x-circle',
          iconType: 'feather' as const,
          title: 'Payment Failed',
          message: 'The payment could not be processed. Please try again.',
        };
      case 'cancelled':
        return {
          color: colors.textSecondary,
          icon: 'slash',
          iconType: 'feather' as const,
          title: 'Payment Cancelled',
          message: 'The payment was cancelled.',
        };
      default:
        return {
          color: colors.textSecondary,
          icon: 'help-circle',
          iconType: 'feather' as const,
          title: 'Payment Status',
          message: 'Unknown payment status.',
        };
    }
  };

  if (!transaction) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.emptyContainer}>
          <Icon
            name="smartphone"
            type="feather"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No M-Pesa transaction
          </Text>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(transaction.status);
  const isActionable = transaction.status === 'failed' || transaction.status === 'pending';

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: statusConfig.color + '20' }]}>
            <Icon
              name={statusConfig.icon}
              type={statusConfig.iconType}
              size={24}
              color={statusConfig.color}
            />
          </View>
          <View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {statusConfig.title}
            </Text>
            <Text style={[styles.amount, { color: colors.text }]}>
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
        </View>
        {onViewDetails && (
          <TouchableOpacity onPress={onViewDetails}>
            <Text style={[styles.viewDetails, { color: colors.primary }]}>
              Details
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {statusConfig.message}
      </Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Phone Number
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatPhoneNumber(transaction.phoneNumber)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Transaction Date
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {new Date(transaction.transactionDate).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Reference
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {transaction.reference}
          </Text>
        </View>
        {transaction.description && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Description
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {transaction.description}
            </Text>
          </View>
        )}
      </View>

      {isActionable && (
        <View style={styles.actionsContainer}>
          {transaction.status === 'failed' && onRetry && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={onRetry}
            >
              <Icon name="refresh-cw" type="feather" size={18} color={colors.white} />
              <Text style={[styles.actionText, { color: colors.white }]}>
                Retry Payment
              </Text>
            </TouchableOpacity>
          )}
          
          {onContactSupport && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background }]}
              onPress={onContactSupport}
            >
              <Icon name="headphones" type="feather" size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Contact Support
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Layout.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    marginBottom: Layout.spacing.md,
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: Layout.spacing.xs,
  },
});