// components/dashboard/LeaveBalanceCard.tsx - Updated version
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';

export interface LeaveBalance {
  type: 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'study' | 'unpaid';
  total: number;
  taken: number;
  remaining: number;
  unit?: 'days' | 'hours';
}

export interface LeaveBalanceCardProps {
  balances?: LeaveBalance[];
  onApplyLeave?: () => void;
  onViewDetails?: () => void;
  title?: string;
}

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({
  balances = [],
  onApplyLeave,
  onViewDetails,
  title = 'Leave Balance',
}) => {
  const { colors } = useTheme();

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'annual':
        return { name: 'palm-tree', type: 'material-community' as const, color: colors.success };
      case 'sick':
        return { name: 'hospital-box', type: 'material-community' as const, color: colors.error };
      case 'casual':
        return { name: 'coffee', type: 'material-community' as const, color: colors.info || colors.primary };
      case 'maternity':
        return { name: 'baby-carriage', type: 'material-community' as const, color: colors.warning };
      case 'paternity':
        return { name: 'human-male-child', type: 'material-community' as const, color: colors.primary };
      case 'study':
        return { name: 'school', type: 'material-community' as const, color: colors.warning };
      default:
        return { name: 'calendar', type: 'material-community' as const, color: colors.textSecondary };
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual': return 'Annual';
      case 'sick': return 'Sick';
      case 'casual': return 'Casual';
      case 'maternity': return 'Maternity';
      case 'paternity': return 'Paternity';
      case 'study': return 'Study';
      case 'unpaid': return 'Unpaid';
      default: return type;
    }
  };

  const totalRemaining = balances.reduce((sum, balance) => sum + balance.remaining, 0);

  return (
    <Card variant="elevated" padding="lg" style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.total, { color: colors.primary }]}>
            {totalRemaining} days left
          </Text>
        </View>
        {onApplyLeave && (
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={onApplyLeave}
          >
            <Icon name="plus" type="material-community" size={16} color={colors.card} />
            <Text style={[styles.applyText, { color: colors.card }]}>
              Apply
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.balancesGrid}>
        {balances.map((balance, index) => {
          const icon = getLeaveTypeIcon(balance.type);
          const percentage = balance.total > 0 ? (balance.taken / balance.total) * 100 : 0;

          return (
            <View key={index} style={styles.balanceItem}>
              <View style={styles.balanceHeader}>
                <View style={[styles.balanceIcon, { backgroundColor: icon.color + '20' }]}>
                  <Icon
                    name={icon.name}
                    type={icon.type}
                    size={16}
                    color={icon.color}
                  />
                </View>
                <Text style={[styles.balanceType, { color: colors.text }]}>
                  {getLeaveTypeLabel(balance.type)}
                </Text>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: icon.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {balance.taken}/{balance.total}
                </Text>
              </View>

              <Text style={[styles.remainingText, { color: colors.text }]}>
                {balance.remaining} {balance.unit || 'days'} remaining
              </Text>
            </View>
          );
        })}
      </View>

      {onViewDetails && (
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={onViewDetails}
        >
          <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
            View Leave Details
          </Text>
          <Icon name="chevron-right" type="material-community" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  total: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  applyText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: Layout.spacing.xs,
  },
  balancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  balanceItem: {
    width: '48%',
    marginBottom: Layout.spacing.md,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.xs,
  },
  balanceType: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: Layout.spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    textAlign: 'right',
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '500',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
});