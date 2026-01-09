import React, { useState, useEffect } from 'react';
import { Button } from 'react-native';

import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { Layout } from '@/constants/Layout';

// Your theme colors
const THEME_COLORS = {
  cream: '#e9ded3',
  primaryBlue: '#0056b3',
  gold: '#deab63',
  white: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  borderLight: '#e5e7eb',
  background: '#f9fafb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
};

export default function ProfileScreen() {
  const { user, employee, fetchEmployeeData, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

   const handleRefreshEmployeeData = async () => {
    setFetching(true);
    const result = await fetchEmployeeData();
    setFetching(false);
    
    if (result.success) {
      Alert.alert('Success', 'Employee data refreshed!');
    } else {
      Alert.alert('Error', result.error || 'Failed to refresh employee data');
    }
  };


  // Check if user has profile image
  useEffect(() => {
    if (user?.profile_image) {
      setProfileImage(user.profile_image);
    }
  }, [user]);

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
            const result = await logout();
            
            if (result.success) {
              // Logout was successful, user will be redirected to /
              // You can optionally show a success message
              Alert.alert(
                'Logged Out',
                'You have been successfully logged out.',
                [{ text: 'OK' }]
              );
            } else {
              // Logout failed but user was still redirected
              Alert.alert(
                'Logout Error',
                result.error || 'Failed to logout completely.',
                [{ text: 'OK' }]
              );
            }
          } catch (error: any) {
            console.error('Logout error:', error);
            Alert.alert(
              'Error',
              'Unable to logout. Please try again.',
              [{ text: 'OK' }]
            );
          }
        },
      },
    ],
    { cancelable: true }
  );
};

  const menuItems = [
    {
      title: 'Change Password',
      icon: 'lock-closed-outline',
      onPress: () => router.push('/(app)/profile/change-password'),
      visible: true,
    }
  ];

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'KSh 0';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatRole = (role: string | undefined) => {
    if (!role) return 'Employee';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const formatEmploymentType = (type: string | undefined) => {
    if (!type) return 'Not specified';
    const types: Record<string, string> = {
      'PERM': 'Permanent',
      'CONT': 'Contract',
      'CAS': 'Casual',
      'PROB': 'Probation',
      'INT': 'Intern',
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                  {user?.last_name?.[0]?.toUpperCase() || 'S'}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editButton}
              // onPress={() => router.push('/app/profile/edit')}
            >
              <Feather name="edit-2" size={16} color={THEME_COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {formatRole(user?.role || employee?.employment_type)}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <Button 
          title={fetching ? "Refreshing..." : "Refresh Employee Data"}
          onPress={handleRefreshEmployeeData}
          disabled={fetching}
        />
      </View>

      {/* Employee Information Card - UPDATED WITH 5PX MARGIN AND 2 COLUMNS */}
      {employee && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="user" size={20} color={THEME_COLORS.primaryBlue} />
            <Text style={styles.cardTitle}>Employee Information</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Feather name="hash" size={18} color={THEME_COLORS.textSecondary} />
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue}>{employee.employee_number || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="briefcase" size={18} color={THEME_COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Job Title</Text>
              <Text style={styles.infoValue}>{employee.job_title || 'Not specified'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="layers" size={18} color={THEME_COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Dept</Text>
              <Text style={styles.infoValue}>{employee.department_name || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="clock" size={18} color={THEME_COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{formatEmploymentType(employee.employment_type)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="calendar" size={18} color={THEME_COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Hire Date</Text>
              <Text style={styles.infoValue}>{formatDate(employee.hire_date)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Feather name="dollar-sign" size={18} color={THEME_COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Salary</Text>
              <Text style={styles.infoValue}>{formatCurrency(employee.basic_salary)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      {employee && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="home" size={24} color={THEME_COLORS.primaryBlue} />
            <Text style={styles.statValue}>{employee.housing_allowance ? formatCurrency(employee.housing_allowance) : 'N/A'}</Text>
            <Text style={styles.statLabel}>Housing</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Feather name="truck" size={24} color={THEME_COLORS.primaryBlue} />
            <Text style={styles.statValue}>{employee.transport_allowance ? formatCurrency(employee.transport_allowance) : 'N/A'}</Text>
            <Text style={styles.statLabel}>Transport</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Feather name="activity" size={24} color={THEME_COLORS.primaryBlue} />
            <Text style={styles.statValue}>{employee.medical_allowance ? formatCurrency(employee.medical_allowance) : 'N/A'}</Text>
            <Text style={styles.statLabel}>Medical</Text>
          </View>
        </View>
      )}

      {/* Menu & Logout */}
      <View style={styles.menuContainer}>
        {menuItems.filter(item => item.visible).map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={22} color={THEME_COLORS.primaryBlue} />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={THEME_COLORS.gray400} />
          </TouchableOpacity>
        ))}
      </View>
      

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <View style={styles.logoutButtonContent}>
          <Feather name="log-out" size={22} color={THEME_COLORS.danger} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Elore HR v1.0.0</Text>
      </View>

      
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.cream,
  },
  header: {
    backgroundColor: THEME_COLORS.primaryBlue,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME_COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: THEME_COLORS.white,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: THEME_COLORS.white,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: THEME_COLORS.white,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME_COLORS.gold,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: THEME_COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.white,
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: THEME_COLORS.white,
    marginBottom: 15,
    opacity: 0.9,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.white,
  },
  
  // UPDATED SECTION: 5px outer margin
  card: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5, // Exact 5px margin outside
    marginTop: 20,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  
  // UPDATED SECTION: 2-column grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48.5%', // Forces 2 columns
    backgroundColor: THEME_COLORS.gray50,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME_COLORS.gray100,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: THEME_COLORS.textSecondary,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    textAlign: 'center',
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    marginHorizontal: 5,
    marginTop: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: THEME_COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: THEME_COLORS.gray200,
    alignSelf: 'center',
  },
  menuContainer: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    marginHorizontal: 5,
    marginTop: 20,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.gray100,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: THEME_COLORS.textPrimary,
  },
  logoutButton: {
    backgroundColor: THEME_COLORS.white,
    marginHorizontal: 5,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.danger,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 12,
    color: THEME_COLORS.textTertiary,
  },
});