// components/ui/Checkbox.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Layout } from '@/constants/Layout';

const THEME_COLORS = {
  primaryBlue: '#0056b3',
  white: '#ffffff',
  textPrimary: '#111827',
  borderLight: '#e5e7eb',
  gray100: '#f3f4f6',
};

interface CheckboxProps extends TouchableOpacityProps {
  checked: boolean;
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function Checkbox({
  checked,
  label,
  onPress,
  disabled = false,
  size = 'medium',
  style,
  ...props
}: CheckboxProps) {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const checkboxSize = sizeMap[size];

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <View
        style={[
          styles.checkbox,
          {
            width: checkboxSize,
            height: checkboxSize,
            borderWidth: checked ? 0 : 1,
            backgroundColor: checked ? THEME_COLORS.primaryBlue : 'transparent',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {checked && (
          <Feather name="check" size={checkboxSize - 8} color={THEME_COLORS.white} />
        )}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            { fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16 },
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: THEME_COLORS.borderLight,
  },
  label: {
    marginLeft: Layout.spacing.sm,
    color: THEME_COLORS.textPrimary,
  },
  labelDisabled: {
    color: THEME_COLORS.borderLight,
  },
});