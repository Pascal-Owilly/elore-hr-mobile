// components/ui/Chip.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Layout } from '@/constants/Layout';
import { Icon, IconProps } from '@/components/ui/Icon';

interface ChipProps {
  label: string;
  color?: string;
  icon?: string;
  iconType?: IconProps['type'];
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  color,
  icon,
  iconType = 'feather',
  size = 'medium',
  variant = 'filled',
}) => {
  const { colors } = useTheme();
  const chipColor = color || colors.primary;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 6, paddingVertical: 2 };
      case 'large':
        return { paddingHorizontal: 12, paddingVertical: 6 };
      default:
        return { paddingHorizontal: 8, paddingVertical: 4 };
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'small': return { fontSize: 10 };
      case 'large': return { fontSize: 14 };
      default: return { fontSize: 12 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'large': return 14;
      default: return 12;
    }
  };

  const backgroundColor = variant === 'filled' ? chipColor + '20' : 'transparent';
  const borderColor = variant === 'outlined' ? chipColor : 'transparent';

  return (
    <View style={[
      styles.container,
      getSizeStyles(),
      { backgroundColor, borderColor },
    ]}>
      {icon && (
        <Icon
          name={icon}
          type={iconType}
          size={getIconSize()}
          color={chipColor}
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text,
        getTextSizeStyles(),
        { color: chipColor },
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {
    fontWeight: '500',
  },
  icon: {
    marginRight: 4,
  },
});