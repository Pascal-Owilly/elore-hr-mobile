// components/ui/FilterButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Layout } from '@/constants/Layout';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  isActive,
  onPress,
  icon,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: isActive ? colors.primary : colors.card,
          borderColor: isActive ? colors.primary : colors.border 
        },
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.text,
        { color: isActive ? colors.card : colors.text },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 20,
    marginRight: Layout.spacing.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});