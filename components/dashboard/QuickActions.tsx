import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface Action {
  id: string;
  title: string;
  icon: string;
  iconType?: string; // Make this optional
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: Action[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              { backgroundColor: action.color },
              action.disabled && styles.disabledButton,
            ]}
            onPress={action.disabled ? undefined : action.onPress}
            disabled={action.disabled}
            activeOpacity={0.7}
          >
            <Icon
              name={action.icon}
              type={action.iconType || 'material-community'} // Use iconType if provided
              size={24}
              color={Colors.white}
            />
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  scrollContent: {
    gap: Layout.spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    color: Colors.white,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
});