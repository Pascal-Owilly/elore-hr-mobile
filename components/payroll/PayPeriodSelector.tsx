// components/payroll/PayPeriodSelector.tsx - Updated with safety checks
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export interface PayPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: 'paid' | 'pending' | 'processing';
}

export interface PayPeriodSelectorProps {
  periods?: PayPeriod[]; // Make optional
  selectedPeriodId?: string;
  onSelectPeriod: (period: PayPeriod) => void;
  onAddPeriod?: () => void;
}

export const PayPeriodSelector: React.FC<PayPeriodSelectorProps> = ({
  periods = [] = [], // Default to empty array
  selectedPeriodId,
  onSelectPeriod,
  onAddPeriod,
}) => {
  const { colors } = useTheme();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
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

  // If no periods, show empty state
  if (!periods || periods.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Pay Periods
          </Text>
          {onAddPeriod && (
            <TouchableOpacity onPress={onAddPeriod} style={styles.addButton}>
              <Icon name="plus" type="material-community" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptyState}>
          <Icon
            name="calendar-blank"
            type="material-community"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No pay periods available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Pay Periods
        </Text>
        {onAddPeriod && (
          <TouchableOpacity onPress={onAddPeriod} style={styles.addButton}>
            <Icon name="plus" type="material-community" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {periods.map((period) => {
          const isSelected = period.id === selectedPeriodId;
          const statusColor = getStatusColor(period.status);

          return (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodCard,
                {
                  backgroundColor: isSelected ? colors.primary + '10' : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelectPeriod(period)}
            >
              <View style={styles.periodHeader}>
                <Text
                  style={[
                    styles.periodLabel,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {period.label}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <Icon
                  name="calendar-range"
                  type="material-community"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {formatDate(period.startDate)} - {formatDate(period.endDate)}
                </Text>
              </View>

              {isSelected && (
                <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: Layout.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Layout.spacing.md,
  },
  scrollContent: {
    paddingRight: Layout.spacing.md,
  },
  periodCard: {
    width: 180,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginRight: Layout.spacing.md,
    borderWidth: 1,
    position: 'relative',
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.sm,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: Layout.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    marginLeft: Layout.spacing.xs,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    height: 3,
    borderTopLeftRadius: Layout.borderRadius.md,
    borderTopRightRadius: Layout.borderRadius.md,
  },
});