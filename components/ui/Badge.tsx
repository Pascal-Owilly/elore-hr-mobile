// components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  text: string;
  color?: string;
  variant?: 'filled' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  text,
  color = '#6B7280',
  variant = 'filled',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 6, paddingVertical: 2 };
      case 'large':
        return { paddingHorizontal: 12, paddingVertical: 4 };
      default:
        return { paddingHorizontal: 8, paddingVertical: 3 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 14;
      default:
        return 12;
    }
  };

  const backgroundColor = variant === 'filled' ? `${color}20` : 'transparent';
  const borderColor = variant === 'outline' ? color : 'transparent';

  return (
    <View
      style={[
        styles.badge,
        getSizeStyles(),
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: getTextSize(),
            color: variant === 'filled' ? color : color,
            fontWeight: size === 'small' ? '500' : '600',
          },
          textStyle,
        ]}
      >
        {text.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});