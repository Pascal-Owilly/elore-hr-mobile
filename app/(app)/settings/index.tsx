// app/(app)/settings/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@lib/providers/AuthProvider';
import { Colors } from '@constants/Colors';
import { Layout } from '@constants/Layout';
import { Icon } from '@components/ui/Icon';

export default function SettingsScreen() {
  const { user, biometricInfo, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = async () => {
    await logout();
  };

  const settingsItems = [
    {
      title: 'Account',
      icon: 'user',
      items: [
        {
          title: 'Profile',
          icon: 'user',
          onPress: () => router.push('/profile'),
        },
        {
          title: 'Change Password',
          icon: 'lock',
          onPress: () => router.push('/auth/change-password'),
        },
      ],
    },
    {
      title: 'Security',
      icon: 'shield',
      items: [
        {
          title: 'Biometric Login',
          icon: 'fingerprint',
          onPress: () => router.push('/settings/biometric'),
          badge: biometricInfo.enabled ? 'Enabled' : 'Available',
        },
        {
          title: 'Two-Factor Authentication',
          icon: 'shield-check',
          onPress: () => {},
          badge: 'Not Setup',
        },
      ],
    },
    {
      title: 'Preferences',
      icon: 'settings',
      items: [
        {
          title: 'Notifications',
          icon: 'bell',
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.gray300, true: Colors.primaryBlue400 }}
              thumbColor={notificationsEnabled ? Colors.primaryBlue600 : Colors.gray100}
            />
          ),
        },
        {
          title: 'Language',
          icon: 'globe',
          rightText: 'English',
          onPress: () => {},
        },
        {
          title: 'Theme',
          icon: 'moon',
          rightText: 'Light',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      icon: 'help-circle',
      items: [
        {
          title: 'Help & Support',
          icon: 'help-circle',
          onPress: () => {},
        },
        {
          title: 'Privacy Policy',
          icon: 'shield',
          onPress: () => {},
        },
        {
          title: 'Terms of Service',
          icon: 'file-text',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* User Info Section */}
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Icon name="user" type="feather" size={40} color={Colors.white} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.first_name || 'User'} {user?.last_name || ''}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>
            {user?.role === 'admin' ? 'Administrator' : 'Employee'}
          </Text>
        </View>
      </View>

      {/* Settings Sections */}
      {settingsItems.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name={section.icon as any} type="feather" size={18} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.sectionCard}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.settingItem,
                  itemIndex !== section.items.length - 1 && styles.settingItemBorder,
                ]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <View style={styles.settingItemLeft}>
                  <Icon name={item.icon as any} type="feather" size={20} color={Colors.primaryBlue600} />
                  <Text style={styles.settingItemTitle}>{item.title}</Text>
                </View>
                <View style={styles.settingItemRight}>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.rightText && (
                    <Text style={styles.rightText}>{item.rightText}</Text>
                  )}
                  {item.rightComponent}
                  {item.onPress && (
                    <Icon name="chevron-right" type="feather" size={20} color={Colors.gray400} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="log-out" type="feather" size={20} color={Colors.error600} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>HR System v1.0.0</Text>
        <Text style={styles.copyrightText}>© 2026 Elore HR Kenya</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: Layout.spacing.lg,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.md,
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primaryBlue600,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: Colors.primaryBlue600,
    fontWeight: '600',
    backgroundColor: Colors.primaryBlue50,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  section: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    paddingLeft: Layout.spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Layout.shadow.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.lg,
    minHeight: 56,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  badge: {
    backgroundColor: Colors.primaryBlue100,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.primaryBlue700,
    fontWeight: '600',
  },
  rightText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    backgroundColor: Colors.error50,
    margin: Layout.spacing.lg,
    marginTop: Layout.spacing.xl,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error200,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error700,
  },
  versionContainer: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: Layout.spacing.xs,
  },
  copyrightText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});