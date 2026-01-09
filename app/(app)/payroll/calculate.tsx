// app/(app)/payroll/calculate.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput as RNTextInput
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Layout } from '@/constants/Layout';
import { KenyaConstants } from '@constants/KenyaConstants';

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
  info: '#3b82f6',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
};

interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_locked: boolean;
}

interface Employee {
  id: string;
  employee_number: string;
  user: {
    first_name: string;
    last_name: string;
  };
  department: {
    name: string;
  } | null;
  salary_structure?: {
    basic_salary: number;
    housing_allowance: number;
    transport_allowance: number;
    medical_allowance: number;
  };
}

export default function CalculatePayrollScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Check if user is loaded
  useEffect(() => {
    if (!authLoading && !user) {
      setAuthError(true);
      Alert.alert(
        'Authentication Required',
        'You need to be logged in to access this feature.',
        [
          { text: 'Login', onPress: () => router.replace('/auth/login') }
        ]
      );
    }
  }, [authLoading, user]);

  // Fetch payroll periods
  const { 
    data: periods, 
    isLoading: periodsLoading,
    isError: periodsError,
    refetch: refetchPeriods 
  } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: async () => {
      try {
        const response = await api.get('/payroll/periods/');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching payroll periods:', error);
        if (error.response?.status === 401) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [
              { text: 'Login', onPress: () => router.replace('/auth/login') }
            ]
          );
        }
        throw error;
      }
    },
    enabled: !authLoading && !!user, // Only fetch if user is authenticated
  });

  // Fetch active employees
  const { 
    data: employees, 
    isLoading: employeesLoading,
    isError: employeesError,
    refetch: refetchEmployees 
  } = useQuery({
    queryKey: ['active-employees'],
    queryFn: async () => {
      try {
        const response = await api.get('/employees/employees/', {
          params: {
            is_active: true,
            page_size: 100
          }
        });
        return response.data.results || [];
      } catch (error: any) {
        console.error('Error fetching employees:', error);
        if (error.response?.status === 401) {
          router.replace('/auth/login');
        }
        return [];
      }
    },
    enabled: !authLoading && !!user, // Only fetch if user is authenticated
  });

  // Calculate payroll mutation
  const calculateMutation = useMutation({
    mutationFn: async (data: { period_id: string; employee_ids?: string[] }) => {
      const response = await api.post('/payroll/calculate/', data);
      return response.data;
    },
    onSuccess: (data) => {
      Alert.alert(
        'Success',
        `Payroll calculated for ${data.results?.length || 0} employees`,
        [
          { text: 'View Results', onPress: () => router.push('/app/payroll') },
          { text: 'Process Payments', onPress: () => {
            if (selectedPeriod) {
              router.push({
                pathname: '/app/payroll/process',
                params: { periodId: selectedPeriod }
              });
            }
          }}
        ]
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payroll-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Error', 
        error.response?.data?.detail || error.message || 'Failed to calculate payroll'
      );
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPeriods(), refetchEmployees()]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return KenyaConstants.currency.format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return THEME_COLORS.warning;
      case 'CALCULATED':
        return THEME_COLORS.info;
      case 'APPROVED':
        return THEME_COLORS.success;
      case 'PAID':
        return THEME_COLORS.primaryBlue;
      default:
        return THEME_COLORS.textSecondary;
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees?.filter((emp: Employee) => {
    const fullName = `${emp.user.first_name} ${emp.user.last_name}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      emp.employee_number.toLowerCase().includes(searchLower) ||
      emp.department?.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees(new Set());
    } else {
      const allIds = filteredEmployees.map((emp: Employee) => emp.id);
      setSelectedEmployees(new Set(allIds));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual employee selection
  const handleEmployeeSelect = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
      setSelectAll(false);
    } else {
      newSelected.add(employeeId);
      if (newSelected.size === filteredEmployees.length) {
        setSelectAll(true);
      }
    }
    setSelectedEmployees(newSelected);
  };

  // Handle calculate payroll
  const handleCalculate = () => {
    if (!selectedPeriod) {
      Alert.alert('Error', 'Please select a payroll period');
      return;
    }

    if (selectedEmployees.size === 0) {
      Alert.alert('Error', 'Please select at least one employee');
      return;
    }

    Alert.alert(
      'Calculate Payroll',
      `Calculate payroll for ${selectedEmployees.size} employees?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Calculate', 
          onPress: () => {
            calculateMutation.mutate({
              period_id: selectedPeriod,
              employee_ids: Array.from(selectedEmployees)
            });
          }
        }
      ]
    );
  };

  // Show loading state
  if (authLoading || authError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primaryBlue} />
        <Text style={styles.loadingText}>
          {authError ? 'Authentication required...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  const isLoading = periodsLoading || employeesLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading payroll data...</Text>
      </View>
    );
  }

  // Show error state
  if (periodsError || employeesError) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={THEME_COLORS.danger} />
        <Text style={styles.errorTitle}>Unable to Load Data</Text>
        <Text style={styles.errorMessage}>
          There was a problem loading payroll data. Please check your connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[THEME_COLORS.primaryBlue]}
          tintColor={THEME_COLORS.primaryBlue}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={THEME_COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Calculate Payroll</Text>
          <Text style={styles.subtitle}>
            {user?.organization?.name || 'Organization'}
          </Text>
        </View>
      </View>

      {/* Rest of your component remains the same */}
      {/* Payroll Period Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Payroll Period</Text>
        <Text style={styles.cardSubtitle}>Choose the period for payroll calculation</Text>
        
        {periods?.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color={THEME_COLORS.textTertiary} />
            <Text style={styles.emptyStateText}>No payroll periods available</Text>
            <Text style={styles.emptyStateSubtext}>
              Create a payroll period in the admin panel first
            </Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodsScrollContent}
          >
            {periods?.map((period: PayrollPeriod) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodCard,
                  selectedPeriod === period.id && styles.periodCardSelected,
                  period.is_locked && styles.periodCardLocked
                ]}
                onPress={() => !period.is_locked && setSelectedPeriod(period.id)}
                disabled={period.is_locked}
              >
                {period.is_locked && (
                  <Feather name="lock" size={16} color={THEME_COLORS.warning} style={styles.lockIcon} />
                )}
                
                <Text style={[
                  styles.periodName,
                  selectedPeriod === period.id && styles.periodNameSelected,
                  period.is_locked && styles.periodNameDisabled
                ]}>
                  {period.name}
                </Text>
                
                <Text style={styles.periodDate}>
                  {formatDate(period.start_date)} - {formatDate(period.end_date)}
                </Text>
                
                <View style={[
                  styles.periodStatus,
                  { backgroundColor: getStatusColor(period.status) }
                ]}>
                  <Text style={styles.periodStatusText}>
                    {period.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Employee Selection */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Select Employees</Text>
            <Text style={styles.cardSubtitle}>
              {selectedEmployees.size} of {filteredEmployees.length} selected
            </Text>
          </View>
          {filteredEmployees.length > 0 && (
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
              <Feather 
                name={selectAll ? "check-square" : "square"} 
                size={20} 
                color={THEME_COLORS.primaryBlue} 
              />
              <Text style={styles.selectAllText}>
                {selectAll ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Simple search input */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={THEME_COLORS.textSecondary} style={styles.searchIcon} />
          <RNTextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search employees..."
            placeholderTextColor={THEME_COLORS.textTertiary}
          />
        </View>

        {filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="users" size={32} color={THEME_COLORS.textTertiary} />
            <Text style={styles.emptyStateText}>
              {employees?.length === 0 ? 'No active employees found' : 'No employees match your search'}
            </Text>
          </View>
        ) : (
          <View style={styles.employeesList}>
            {filteredEmployees.map((emp: Employee) => {
              const isSelected = selectedEmployees.has(emp.id);
              const salary = emp.salary_structure?.basic_salary || 0;
              
              return (
                <TouchableOpacity
                  key={emp.id}
                  style={[
                    styles.employeeCard,
                    isSelected && styles.employeeCardSelected
                  ]}
                  onPress={() => handleEmployeeSelect(emp.id)}
                >
                  <View style={styles.employeeHeader}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked
                    ]}>
                      {isSelected && (
                        <Feather name="check" size={14} color={THEME_COLORS.white} />
                      )}
                    </View>
                    
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>
                        {emp.user.first_name} {emp.user.last_name}
                      </Text>
                      <Text style={styles.employeeNumber}>
                        {emp.employee_number}
                      </Text>
                      {emp.department && (
                        <Text style={styles.employeeDepartment}>
                          {emp.department.name}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.employeeSalary}>
                    <Text style={styles.salaryLabel}>Basic Salary</Text>
                    <Text style={styles.salaryAmount}>
                      {formatCurrency(salary)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.calculateButton,
            (!selectedPeriod || selectedEmployees.size === 0 || calculateMutation.isPending) && styles.buttonDisabled
          ]} 
          onPress={handleCalculate}
          disabled={!selectedPeriod || selectedEmployees.size === 0 || calculateMutation.isPending}
        >
          {calculateMutation.isPending ? (
            <ActivityIndicator size="small" color={THEME_COLORS.white} />
          ) : (
            <>
              <Feather name="calculator" size={20} color={THEME_COLORS.white} />
              <Text style={styles.calculateButtonText}>Calculate Payroll</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Information Card */}
      <View style={[styles.card, styles.infoCard]}>
        <View style={styles.infoHeader}>
          <Feather name="info" size={20} color={THEME_COLORS.info} />
          <Text style={styles.infoTitle}>Calculation Information</Text>
        </View>
        
        <Text style={styles.infoText}>
          • Basic salary and allowances are calculated from salary structure{'\n'}
          • Overtime and night shift hours will be added from attendance records{'\n'}
          • Statutory deductions (NSSF, NHIF, PAYE) are calculated automatically{'\n'}
          • Other deductions (loans, advances) are included if applicable{'\n'}
          • Calculations can be reviewed before processing payments
        </Text>
      </View>
    </ScrollView>
  );
}

// Add these new styles
const styles = StyleSheet.create({
  // ... (keep all existing styles)

  headerContent: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: THEME_COLORS.white + 'CC',
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.cream,
    paddingHorizontal: Layout.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  errorMessage: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  retryButton: {
    backgroundColor: THEME_COLORS.primaryBlue,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: THEME_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: THEME_COLORS.textTertiary,
    textAlign: 'center',
  },
});