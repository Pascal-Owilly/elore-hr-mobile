import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { api } from '@/lib/api/client';

export default function ProfileScreen() {
  const { user, employee, logout, clearAuth } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Try to call logout API endpoint if it exists
              try {
                await api.post('/auth/logout/');
                console.log('✅ Backend logout successful');
              } catch (apiError) {
                console.log('ℹ️ Backend logout endpoint not available, continuing with local logout');
              }

              // Clear local auth state
              await logout();
              
              // Clear any cached data if needed
              await clearAuth?.();
              
              // Redirect to login screen
              router.replace('/app/index');
              
              // Optional: Show success message
              // You could use a toast notification here instead
              setTimeout(() => {
                Alert.alert('Success', 'You have been logged out successfully');
              }, 500);
              
            } catch (error) {
              console.error('Logout error:', error);
              
              // Even if there's an error, still try to logout locally
              try {
                await logout();
                router.replace('/auth/login');
              } catch (localError) {
                Alert.alert(
                  'Error',
                  'Unable to logout. Please try again.',
                  [
                    {
                      text: 'OK',
                      onPress: () => console.log('Logout error acknowledged'),
                    },
                  ]
                );
              }
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    {
      title: 'Account Settings',
      icon: 'settings-outline',
      onPress: () => router.push('/app/profile/settings'),
    },
    {
      title: 'Change Password',
      icon: 'lock-closed-outline',
      onPress: () => router.push('/app/profile/change-password'),
    },
    {
      title: 'Privacy & Security',
      icon: 'shield-checkmark-outline',
      onPress: () => router.push('/app/profile/privacy'),
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => router.push('/app/profile/support'),
    },
    {
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => router.push('/app/profile/about'),
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.first_name?.[0]?.toUpperCase() || 'U'}
                {user?.last_name?.[0]?.toUpperCase() || 'S'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/app/profile/edit')}
            >
              <Ionicons name="pencil" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>{user?.role || 'Employee'}</Text>
        </View>
      </View>

      {/* Employee Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Employee Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color={Colors.primaryBlue500} />
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValue}>
              {employee?.employee_number || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.primaryBlue500} />
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>
              {employee?.department?.name || 'Not assigned'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="ribbon-outline" size={20} color={Colors.primaryBlue500} />
            <Text style={styles.infoLabel}>Job Title</Text>
            <Text style={styles.infoValue}>
              {employee?.job_title || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primaryBlue500} />
            <Text style={styles.infoLabel}>Employment Type</Text>
            <Text style={styles.infoValue}>
              {employee?.employment_type || 'Permanent'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>21</Text>
          <Text style={styles.statLabel}>Leave Days</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>45</Text>
          <Text style={styles.statLabel}>Hours This Week</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={22} color={Colors.primaryBlue500} />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <View style={styles.logoutButtonContent}>
          <Ionicons name="log-out-outline" size={22} color={Colors.danger500} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </View>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          HR System Kenya v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    backgroundColor: Colors.primaryBlue600,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Layout.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryBlue400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.success500,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Layout.spacing.xs,
  },
  userEmail: {
    fontSize: Layout.fontSize.md,
    color: Colors.gray200,
    marginBottom: Layout.spacing.xs,
  },
  userRole: {
    fontSize: Layout.fontSize.sm,
    color: Colors.gray300,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    marginHorizontal: Layout.spacing.lg,
    marginTop: -Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.md,
  },
  cardTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
  },
  infoItem: {
    width: '48%',
    backgroundColor: Colors.gray50,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
    marginBottom: Layout.spacing.xxs,
  },
  infoValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    paddingVertical: Layout.spacing.lg,
    ...Layout.shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primaryBlue600,
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.gray200,
    alignSelf: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  menuItemText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textPrimary,
  },
  logoutButton: {
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Layout.shadow.sm,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.lg,
  },
  logoutButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.danger500,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
  },
  versionText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
});