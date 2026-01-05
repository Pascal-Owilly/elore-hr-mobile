// components/payroll/StatutoryBreakdown.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export interface StatutoryItem {
  id: string;
  name: string;
  amount: number;
  rate?: number;
  type: 'deduction' | 'contribution' | 'tax';
}

export interface StatutoryBreakdownProps {
  items?: StatutoryItem[];
  currency?: string;
}

export const StatutoryBreakdown: React.FC<StatutoryBreakdownProps> = ({
  items,
  currency = 'USD',
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
      case 'tax':
        return { name: 'percent', type: 'material-community' as const, color: colors.error };
      case 'deduction':
        return { name: 'minus-circle', type: 'material-community' as const, color: colors.warning };
      case 'contribution':
        return { name: 'handshake', type: 'material-community' as const, color: colors.info };
      default:
        return { name: 'circle', type: 'feather' as const, color: colors.textSecondary };
    }
  };

  const totalDeductions = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Statutory Breakdown
        </Text>
        <Text style={[styles.total, { color: colors.text }]}>
          {formatCurrency(totalDeductions)}
        </Text>
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
                {item.rate && (
                  <Text style={[styles.itemRate, { color: colors.textSecondary }]}>
                    {item.rate}%
                  </Text>
                )}
              </View>
            </View>
            <Text style={[styles.itemAmount, { color: colors.text }]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        );
      })}

      {items.length === 0 && (
        <View style={styles.emptyContainer}>
          <Icon
            name="file-document"
            type="material-community"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No statutory items
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
    fontSize: 16,
    fontWeight: '600',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemRate: {
    fontSize: 12,
  },
  itemAmount: {
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