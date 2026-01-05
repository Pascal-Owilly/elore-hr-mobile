// components/ui/Icon.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@components/theme/ThemeProvider';

export type IconType = 'material' | 'material-community' | 'feather' | 'ionicons';

export interface IconProps {
  name: string;
  type?: IconType;
  size?: number;
  color?: string;
  style?: any;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  type = 'material',
  size = 24,
  color,
  style,
  onPress,
  disabled = false,
  testID,
}) => {
  const { colors } = useTheme();
  const iconColor = color || colors.text;

  const renderIcon = () => {
    const props = {
      name: name as any,
      size,
      color: iconColor,
      style,
      onPress: disabled ? undefined : onPress,
      testID,
    };

    switch (type) {
      case 'material':
        return <MaterialIcons {...props} />;
      case 'material-community':
        return <MaterialCommunityIcons {...props} />;
      case 'feather':
        return <Feather {...props} />;
      case 'ionicons':
        return <Ionicons {...props} />;
      default:
        return <MaterialIcons {...props} />;
    }
  };

  if (onPress) {
    return renderIcon();
  }

  return renderIcon();
};

// Additional icon components for common icons
export const HomeIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="home" type="material" {...props} />
);

export const CalendarIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="calendar" type="material-community" {...props} />
);

export const ProfileIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="account" type="material-community" {...props} />
);

export const TimeIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="clock" type="material-community" {...props} />
);

export const LeaveIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="beach" type="material-community" {...props} />
);

export const PayrollIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="cash" type="material-community" {...props} />
);

export const DocumentIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="file-document" type="material-community" {...props} />
);

export const NotificationIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="bell" type="material-community" {...props} />
);

export const SettingsIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="cog" type="material-community" {...props} />
);

export const LogoutIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="logout" type="material" {...props} />
);

export const ArrowRightIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="chevron-right" type="material-community" {...props} />
);

export const MenuIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="menu" type="material" {...props} />
);

export const SearchIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="magnify" type="material-community" {...props} />
);

export const AddIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="plus" type="material-community" {...props} />
);

export const EditIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="pencil" type="material-community" {...props} />
);

export const DeleteIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="delete" type="material" {...props} />
);

export const CheckIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="check" type="material" {...props} />
);

export const CloseIcon = (props: Omit<IconProps, 'name' | 'type'>) => (
  <Icon name="close" type="material" {...props} />
);