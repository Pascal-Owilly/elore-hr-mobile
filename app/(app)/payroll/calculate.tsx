// app/app/payroll/calculate.tsx
import React, { useState } from 'react';
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
import { router } from 'expo-router';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch payroll periods
  const { 
    data: periods, 
    isLoading: periodsLoading,
    refetch: refetchPeriods 
  } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: async () => {
      const response = await api.get('/payroll/periods/');
      return response.data;
    },
  });

  // Fetch active employees
  const { 
    data: employees, 
    isLoading: employeesLoading,
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
      } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
      }
    },
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
      Alert.alert('Error', error.message || 'Failed to calculate payroll');
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

  const isLoading = periodsLoading || employeesLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading data...</Text>
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
        <Text style={styles.title}>Calculate Payroll</Text>
      </View>

      {/* Payroll Period Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Payroll Period</Text>
        <Text style={styles.cardSubtitle}>Choose the period for payroll calculation</Text>
        
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.cream,
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.primaryBlue,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.lg,
  },
  backButton: {
    marginRight: Layout.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.white,
  },
  card: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  selectAllText: {
    color: THEME_COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '500',
  },
  periodsScrollContent: {
    gap: Layout.spacing.md,
  },
  periodCard: {
    width: 220,
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    borderWidth: 2,
    borderColor: THEME_COLORS.borderLight,
    position: 'relative',
  },
  periodCardSelected: {
    borderColor: THEME_COLORS.primaryBlue,
    backgroundColor: THEME_COLORS.primaryBlue + '10',
  },
  periodCardLocked: {
    opacity: 0.7,
  },
  lockIcon: {
    position: 'absolute',
    top: Layout.spacing.sm,
    right: Layout.spacing.sm,
  },
  periodName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  periodNameSelected: {
    color: THEME_COLORS.primaryBlue,
  },
  periodNameDisabled: {
    color: THEME_COLORS.textTertiary,
  },
  periodDate: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  periodStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.white,
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME_COLORS.gray50,
    borderRadius: 8,
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    fontSize: 16,
    color: THEME_COLORS.textPrimary,
  },
  employeesList: {
    gap: Layout.spacing.md,
  },
  employeeCard: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  employeeCardSelected: {
    borderColor: THEME_COLORS.primaryBlue,
    backgroundColor: THEME_COLORS.primaryBlue + '10',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
    marginRight: Layout.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: THEME_COLORS.primaryBlue,
    borderColor: THEME_COLORS.primaryBlue,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: 2,
  },
  employeeNumber: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 12,
    color: THEME_COLORS.textTertiary,
    fontStyle: 'italic',
  },
  employeeSalary: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.borderLight,
    paddingTop: Layout.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  salaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.primaryBlue,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  cancelButton: {
    backgroundColor: THEME_COLORS.white,
    borderWidth: 2,
    borderColor: THEME_COLORS.borderLight,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textSecondary,
  },
  calculateButton: {
    backgroundColor: THEME_COLORS.primaryBlue,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  infoCard: {
    backgroundColor: THEME_COLORS.info + '10',
    borderColor: THEME_COLORS.info + '30',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    lineHeight: 20,
  },
});