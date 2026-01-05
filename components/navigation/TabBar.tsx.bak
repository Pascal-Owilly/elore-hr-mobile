// components/navigation/TabBar.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@components/theme/ThemeProvider';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors } = useTheme();

  // Define tab configurations
  const tabConfigs = [
    { name: 'Home', route: 'index', icon: 'home', type: 'material' as const },
    { name: 'Attendance', route: 'attendance', icon: 'clock', type: 'material-community' as const },
    { name: 'Leave', route: 'leave', icon: 'beach', type: 'material-community' as const },
    { name: 'Payroll', route: 'payroll', icon: 'cash', type: 'material-community' as const },
    { name: 'Profile', route: 'profile', icon: 'account', type: 'material-community' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabConfigs.map((tab, index) => {
        const route = state.routes.find(r => r.name === tab.route) || state.routes[0];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.route);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={tab.route}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <View style={styles.tabContent}>
              <Icon
                name={tab.icon}
                type={tab.type}
                size={24}
                color={isFocused ? colors.primary : colors.textSecondary}
              />
              <Text style={[
                styles.tabLabel,
                { 
                  color: isFocused ? colors.primary : colors.textSecondary,
                  fontSize: isFocused ? 11 : 10 
                }
              ]}>
                {tab.name}
              </Text>
              {isFocused && (
                <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Layout.tabBarHeight,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Layout.isIOS ? 20 : 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});