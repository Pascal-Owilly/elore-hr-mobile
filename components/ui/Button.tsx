import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon, IconProps } from './Icon';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactElement<IconProps>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.small;
      case 'md':
        return styles.medium;
      case 'lg':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textTertiary;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return Colors.white;
      case 'outline':
        return Colors.primaryBlue600;
      case 'ghost':
        return Colors.primaryBlue600;
      default:
        return Colors.white;
    }
  };

  const getIconColor = () => {
    if (disabled) return Colors.textTertiary;
    return getTextColor();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
          style={styles.loader}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            React.cloneElement(icon, {
              size: size === 'sm' ? 16 : size === 'lg' ? 24 : 20,
              color: getIconColor(),
              style: styles.leftIcon,
            })
          )}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              size === 'sm' && styles.smallText,
              size === 'lg' && styles.largeText,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            React.cloneElement(icon, {
              size: size === 'sm' ? 16 : size === 'lg' ? 24 : 20,
              color: getIconColor(),
              style: styles.rightIcon,
            })
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  small: {
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.md,
  },
  medium: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
  },
  large: {
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.xl,
  },
  smallText: {
    fontSize: Layout.fontSize.sm,
  },
  largeText: {
    fontSize: Layout.fontSize.lg,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.primaryBlue600,
    borderColor: Colors.primaryBlue600,
  },
  secondary: {
    backgroundColor: Colors.gold500,
    borderColor: Colors.gold500,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: Colors.primaryBlue500,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.danger500,
    borderColor: Colors.danger500,
  },
  disabled: {
    opacity: 0.5,
  },
  loader: {
    marginRight: Layout.spacing.sm,
  },
  leftIcon: {
    marginRight: Layout.spacing.sm,
  },
  rightIcon: {
    marginLeft: Layout.spacing.sm,
  },
});