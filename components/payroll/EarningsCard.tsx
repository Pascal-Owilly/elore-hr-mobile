// components/payroll/EarningsCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export interface EarningItem {
  id: string;
  name: string;
  amount: number;
  type: 'salary' | 'bonus' | 'overtime' | 'allowance' | 'commission' | 'reimbursement';
}

export interface EarningsCardProps {
  items?: EarningItem[];
  currency?: string;
  showSummary?: boolean;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({
  items,
  currency = 'USD',
  showSummary = true,
}) => {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'salary':
        return { name: 'cash', type: 'material-community' as const, color: colors.primary };
      case 'bonus':
        return { name: 'gift', type: 'feather' as const, color: colors.success };
      case 'overtime':
        return { name: 'clock', type: 'feather' as const, color: colors.warning };
      case 'allowance':
        return { name: 'home', type: 'feather' as const, color: colors.info };
      case 'commission':
        return { name: 'trending-up', type: 'feather' as const, color: colors.secondary };
      case 'reimbursement':
        return { name: 'refresh-ccw', type: 'feather' as const, color: colors.success };
      default:
        return { name: 'circle', type: 'feather' as const, color: colors.textSecondary };
    }
  };

  const totalEarnings = items.reduce((sum, item) => sum + item.amount, 0);
  const totalTaxable = items
    .filter(item => item.type !== 'reimbursement')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Earnings Breakdown
        </Text>
        {showSummary && (
          <Text style={[styles.total, { color: colors.primary }]}>
            {formatCurrency(totalEarnings)}
          </Text>
        )}
      </View>

      {items.map((item) => {
        const icon = getItemIcon(item.type);

        return (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                <Icon name={icon.name} type={icon.type} size={16} color={icon.color} />
              </View>
              <View>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.itemType, { color: colors.textSecondary }]}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={[styles.itemAmount, { color: colors.text }]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        );
      })}

      {showSummary && items.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Earnings
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(totalEarnings)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Taxable Income
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(totalTaxable)}
            </Text>
          </View>
        </View>
      )}

      {items.length === 0 && (
        <View style={styles.emptyContainer}>
          <Icon
            name="cash"
            type="material-community"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No earnings data
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemType: {
    fontSize: 12,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Layout.spacing.md,
  },
});