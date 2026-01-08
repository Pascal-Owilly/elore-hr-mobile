// app/app/payroll/salary-structure.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Layout } from '@/constants/Layout';
import { KenyaConstants } from '@constants/KenyaConstants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/Input';

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
  position?: string;
}

interface SalaryStructure {
  id: string;
  employee: Employee;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  overtime_rate: number;
  night_shift_rate: number;
  payment_method: string;
  mpesa_number?: string;
  bank_account_number?: string;
  bank_name?: string;
  is_active: boolean;
  effective_date: string;
}

export default function SalaryStructureScreen() {
  const { user, employee } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    basic_salary: '',
    housing_allowance: '',
    transport_allowance: '',
    medical_allowance: '',
    other_allowances: '',
    overtime_rate: '1.5',
    night_shift_rate: '2.0',
    payment_method: 'BANK',
    mpesa_number: '',
    bank_account_number: '',
    bank_name: '',
    effective_date: new Date().toISOString().split('T')[0],
  });

  // Fetch employees without salary structure
  const { 
    data: employees, 
    isLoading: employeesLoading 
  } = useQuery({
    queryKey: ['employees-without-salary'],
    queryFn: async () => {
      const response = await api.get('/employees/employees/', {
        params: {
          is_active: true,
          has_salary_structure: false,
          page_size: 100
        }
      });
      return response.data.results || [];
    },
  });

  // Fetch existing salary structures
  const { 
    data: salaryStructures, 
    isLoading: structuresLoading,
    refetch: refetchStructures 
  } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: async () => {
      const response = await api.get('/payroll/salary-structures/');
      return response.data;
    },
  });

  // Get current user's salary structure
  const { 
    data: mySalaryStructure,
    refetch: refetchMySalary 
  } = useQuery({
    queryKey: ['my-salary-structure'],
    queryFn: async () => {
      const response = await api.get('/payroll/salary-structures/my_salary/');
      return response.data;
    },
  });

  // Create salary structure mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/payroll/salary-structures/', data);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Salary structure created successfully');
      setShowAddModal(false);
      setFormData({
        basic_salary: '',
        housing_allowance: '',
        transport_allowance: '',
        medical_allowance: '',
        other_allowances: '',
        overtime_rate: '1.5',
        night_shift_rate: '2.0',
        payment_method: 'BANK',
        mpesa_number: '',
        bank_account_number: '',
        bank_name: '',
        effective_date: new Date().toISOString().split('T')[0],
      });
      setSelectedEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['employees-without-salary'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create salary structure');
    }
  });

  // Update salary structure mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(`/payroll/salary-structures/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Salary structure updated successfully');
      setShowEditModal(false);
      setSelectedStructure(null);
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['my-salary-structure'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update salary structure');
    }
  });

  // Activate salary structure mutation
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/payroll/salary-structures/${id}/activate/`);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Salary structure activated');
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['my-salary-structure'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to activate salary structure');
    }
  });

  const formatCurrency = (amount: number) => {
    return KenyaConstants.currency.format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const calculateTotalAllowances = (structure: SalaryStructure) => {
    return structure.housing_allowance + 
           structure.transport_allowance + 
           structure.medical_allowance + 
           structure.other_allowances;
  };

  const calculateTotalEarnings = (structure: SalaryStructure) => {
    return structure.basic_salary + calculateTotalAllowances(structure);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (showAddModal && selectedEmployee) {
      // Validate required fields
      if (!formData.basic_salary || parseFloat(formData.basic_salary) <= 0) {
        Alert.alert('Error', 'Basic salary is required and must be greater than 0');
        return;
      }

      const data = {
        employee: selectedEmployee.id,
        basic_salary: parseFloat(formData.basic_salary),
        housing_allowance: parseFloat(formData.housing_allowance) || 0,
        transport_allowance: parseFloat(formData.transport_allowance) || 0,
        medical_allowance: parseFloat(formData.medical_allowance) || 0,
        other_allowances: parseFloat(formData.other_allowances) || 0,
        overtime_rate: parseFloat(formData.overtime_rate),
        night_shift_rate: parseFloat(formData.night_shift_rate),
        payment_method: formData.payment_method,
        mpesa_number: formData.mpesa_number || undefined,
        bank_account_number: formData.bank_account_number || undefined,
        bank_name: formData.bank_name || undefined,
        effective_date: formData.effective_date,
        is_active: true,
      };

      createMutation.mutate(data);
    } else if (showEditModal && selectedStructure) {
      const data = {
        basic_salary: parseFloat(formData.basic_salary) || selectedStructure.basic_salary,
        housing_allowance: parseFloat(formData.housing_allowance) || selectedStructure.housing_allowance,
        transport_allowance: parseFloat(formData.transport_allowance) || selectedStructure.transport_allowance,
        medical_allowance: parseFloat(formData.medical_allowance) || selectedStructure.medical_allowance,
        other_allowances: parseFloat(formData.other_allowances) || selectedStructure.other_allowances,
        overtime_rate: parseFloat(formData.overtime_rate) || selectedStructure.overtime_rate,
        night_shift_rate: parseFloat(formData.night_shift_rate) || selectedStructure.night_shift_rate,
        payment_method: formData.payment_method || selectedStructure.payment_method,
        mpesa_number: formData.mpesa_number || selectedStructure.mpesa_number || undefined,
        bank_account_number: formData.bank_account_number || selectedStructure.bank_account_number || undefined,
        bank_name: formData.bank_name || selectedStructure.bank_name || undefined,
        effective_date: formData.effective_date || selectedStructure.effective_date,
      };

      updateMutation.mutate({ id: selectedStructure.id, data });
    }
  };

  // Handle edit
  const handleEdit = (structure: SalaryStructure) => {
    setSelectedStructure(structure);
    setFormData({
      basic_salary: structure.basic_salary.toString(),
      housing_allowance: structure.housing_allowance.toString(),
      transport_allowance: structure.transport_allowance.toString(),
      medical_allowance: structure.medical_allowance.toString(),
      other_allowances: structure.other_allowances.toString(),
      overtime_rate: structure.overtime_rate.toString(),
      night_shift_rate: structure.night_shift_rate.toString(),
      payment_method: structure.payment_method,
      mpesa_number: structure.mpesa_number || '',
      bank_account_number: structure.bank_account_number || '',
      bank_name: structure.bank_name || '',
      effective_date: structure.effective_date,
    });
    setShowEditModal(true);
  };

  // Handle activate
  const handleActivate = (structure: SalaryStructure) => {
    Alert.alert(
      'Activate Salary Structure',
      `Activate salary structure for ${structure.employee.user.first_name} ${structure.employee.user.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Activate', 
          onPress: () => {
            activateMutation.mutate(structure.id);
          }
        }
      ]
    );
  };

  const isLoading = employeesLoading || structuresLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading salary structures...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={THEME_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Salary Structure</Text>
      </View>

      {/* My Salary Structure */}
      {mySalaryStructure && (
        <Card style={styles.mySalaryCard}>
          <View style={styles.mySalaryHeader}>
            <Feather name="user" size={24} color={THEME_COLORS.primaryBlue} />
            <View style={styles.mySalaryTitle}>
              <Text style={styles.mySalaryName}>My Salary Structure</Text>
              <Text style={styles.mySalaryStatus}>
                {mySalaryStructure.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <View style={styles.salaryBreakdown}>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Basic Salary</Text>
              <Text style={styles.salaryValue}>
                {formatCurrency(mySalaryStructure.basic_salary)}
              </Text>
            </View>
            
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Housing Allowance</Text>
              <Text style={styles.salaryValue}>
                {formatCurrency(mySalaryStructure.housing_allowance)}
              </Text>
            </View>
            
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Transport Allowance</Text>
              <Text style={styles.salaryValue}>
                {formatCurrency(mySalaryStructure.transport_allowance)}
              </Text>
            </View>
            
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Medical Allowance</Text>
              <Text style={styles.salaryValue}>
                {formatCurrency(mySalaryStructure.medical_allowance)}
              </Text>
            </View>
            
            <View style={[styles.salaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Earnings</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(calculateTotalEarnings(mySalaryStructure))}
              </Text>
            </View>
          </View>
          
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentMethod}>
              Payment Method: {mySalaryStructure.payment_method === 'MPESA' ? 'M-Pesa' : 'Bank Transfer'}
            </Text>
            {mySalaryStructure.mpesa_number && (
              <Text style={styles.paymentDetail}>
                M-Pesa: {mySalaryStructure.mpesa_number}
              </Text>
            )}
            {mySalaryStructure.bank_account_number && (
              <Text style={styles.paymentDetail}>
                Bank: {mySalaryStructure.bank_name} - {mySalaryStructure.bank_account_number}
              </Text>
            )}
          </View>
        </Card>
      )}

      {/* Add Salary Structure Button */}
      {user?.role === 'HR' || user?.role === 'ADMIN' ? (
        <Card style={styles.addCard}>
          <View style={styles.addCardContent}>
            <Feather name="plus-circle" size={32} color={THEME_COLORS.primaryBlue} />
            <View style={styles.addCardText}>
              <Text style={styles.addCardTitle}>Create Salary Structure</Text>
              <Text style={styles.addCardSubtitle}>
                Add salary structure for employees
              </Text>
            </View>
            <Button
              title="Add New"
              onPress={() => setShowAddModal(true)}
              style={styles.addButton}
            />
          </View>
        </Card>
      ) : null}

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search salary structures..."
        />
      </View>

      {/* Salary Structures List */}
      <View style={styles.listContainer}>
        {salaryStructures
          ?.filter((structure: SalaryStructure) => {
            const searchLower = searchQuery.toLowerCase();
            const employeeName = `${structure.employee.user.first_name} ${structure.employee.user.last_name}`.toLowerCase();
            const employeeNumber = structure.employee.employee_number.toLowerCase();
            return (
              employeeName.includes(searchLower) ||
              employeeNumber.includes(searchLower) ||
              structure.employee.department?.name.toLowerCase().includes(searchLower)
            );
          })
          .map((structure: SalaryStructure) => (
            <Card key={structure.id} style={styles.structureCard}>
              <View style={styles.structureHeader}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>
                    {structure.employee.user.first_name} {structure.employee.user.last_name}
                  </Text>
                  <Text style={styles.employeeNumber}>
                    {structure.employee.employee_number}
                  </Text>
                  {structure.employee.department && (
                    <Text style={styles.employeeDepartment}>
                      {structure.employee.department.name}
                    </Text>
                  )}
                </View>
                
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: structure.is_active ? THEME_COLORS.success + '20' : THEME_COLORS.warning + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: structure.is_active ? THEME_COLORS.success : THEME_COLORS.warning }
                    ]}>
                      {structure.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.salarySummary}>
                <View style={styles.salaryItem}>
                  <Text style={styles.salaryItemLabel}>Basic</Text>
                  <Text style={styles.salaryItemValue}>
                    {formatCurrency(structure.basic_salary)}
                  </Text>
                </View>
                
                <View style={styles.salaryItem}>
                  <Text style={styles.salaryItemLabel}>Allowances</Text>
                  <Text style={styles.salaryItemValue}>
                    {formatCurrency(calculateTotalAllowances(structure))}
                  </Text>
                </View>
                
                <View style={styles.salaryItem}>
                  <Text style={styles.salaryItemLabel}>Total</Text>
                  <Text style={styles.salaryItemValue}>
                    {formatCurrency(calculateTotalEarnings(structure))}
                  </Text>
                </View>
              </View>
              
              <View style={styles.structureActions}>
                <TouchableOpacity
                  onPress={() => handleEdit(structure)}
                  style={styles.actionButton}
                >
                  <Feather name="edit" size={16} color={THEME_COLORS.textSecondary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                
                {!structure.is_active && (
                  <TouchableOpacity
                    onPress={() => handleActivate(structure)}
                    style={styles.activateButton}
                  >
                    <Feather name="check" size={16} color={THEME_COLORS.success} />
                    <Text style={styles.activateText}>Activate</Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.effectiveDate}>
                  <Text style={styles.effectiveDateText}>
                    Effective: {formatDate(structure.effective_date)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
      </View>

      {/* Add Salary Structure Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedEmployee(null);
        }}
        title="Add Salary Structure"
      >
        <ScrollView style={styles.modalContent}>
          {/* Employee Selection */}
          {!selectedEmployee ? (
            <>
              <Text style={styles.modalSectionTitle}>Select Employee</Text>
              <View style={styles.employeeList}>
                {employees?.map((emp: Employee) => (
                  <TouchableOpacity
                    key={emp.id}
                    style={styles.employeeSelectCard}
                    onPress={() => setSelectedEmployee(emp)}
                  >
                    <Text style={styles.employeeSelectName}>
                      {emp.user.first_name} {emp.user.last_name}
                    </Text>
                    <Text style={styles.employeeSelectNumber}>
                      {emp.employee_number}
                    </Text>
                    {emp.department && (
                      <Text style={styles.employeeSelectDepartment}>
                        {emp.department.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.selectedEmployee}>
                <TouchableOpacity
                  onPress={() => setSelectedEmployee(null)}
                  style={styles.backToSelect}
                >
                  <Feather name="arrow-left" size={16} color={THEME_COLORS.primaryBlue} />
                  <Text style={styles.backToSelectText}>Change Employee</Text>
                </TouchableOpacity>
                
                <Text style={styles.selectedEmployeeName}>
                  {selectedEmployee.user.first_name} {selectedEmployee.user.last_name}
                </Text>
                <Text style={styles.selectedEmployeeNumber}>
                  {selectedEmployee.employee_number}
                </Text>
              </View>

              {/* Salary Details Form */}
              <Text style={styles.modalSectionTitle}>Salary Details</Text>
              
              <TextInput
                label="Basic Salary *"
                value={formData.basic_salary}
                onChangeText={(text) => setFormData({ ...formData, basic_salary: text })}
                placeholder="Enter basic salary"
                keyboardType="decimal-pad"
                required
              />
              
              <TextInput
                label="Housing Allowance"
                value={formData.housing_allowance}
                onChangeText={(text) => setFormData({ ...formData, housing_allowance: text })}
                placeholder="Enter housing allowance"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Transport Allowance"
                value={formData.transport_allowance}
                onChangeText={(text) => setFormData({ ...formData, transport_allowance: text })}
                placeholder="Enter transport allowance"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Medical Allowance"
                value={formData.medical_allowance}
                onChangeText={(text) => setFormData({ ...formData, medical_allowance: text })}
                placeholder="Enter medical allowance"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Other Allowances"
                value={formData.other_allowances}
                onChangeText={(text) => setFormData({ ...formData, other_allowances: text })}
                placeholder="Enter other allowances"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.modalSectionTitle}>Overtime Rates</Text>
              
              <TextInput
                label="Overtime Rate (multiplier)"
                value={formData.overtime_rate}
                onChangeText={(text) => setFormData({ ...formData, overtime_rate: text })}
                placeholder="e.g., 1.5"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Night Shift Rate (multiplier)"
                value={formData.night_shift_rate}
                onChangeText={(text) => setFormData({ ...formData, night_shift_rate: text })}
                placeholder="e.g., 2.0"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.modalSectionTitle}>Payment Details</Text>
              
              <TextInput
                label="Payment Method"
                value={formData.payment_method}
                onChangeText={(text) => setFormData({ ...formData, payment_method: text })}
                placeholder="BANK or MPESA"
              />
              
              {formData.payment_method === 'MPESA' && (
                <TextInput
                  label="M-Pesa Number"
                  value={formData.mpesa_number}
                  onChangeText={(text) => setFormData({ ...formData, mpesa_number: text })}
                  placeholder="e.g., 0712345678"
                />
              )}
              
              {formData.payment_method === 'BANK' && (
                <>
                  <TextInput
                    label="Bank Name"
                    value={formData.bank_name}
                    onChangeText={(text) => setFormData({ ...formData, bank_name: text })}
                    placeholder="Enter bank name"
                  />
                  
                  <TextInput
                    label="Bank Account Number"
                    value={formData.bank_account_number}
                    onChangeText={(text) => setFormData({ ...formData, bank_account_number: text })}
                    placeholder="Enter account number"
                  />
                </>
              )}
              
              <TextInput
                label="Effective Date"
                value={formData.effective_date}
                onChangeText={(text) => setFormData({ ...formData, effective_date: text })}
                placeholder="YYYY-MM-DD"
              />
              
              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setShowAddModal(false);
                    setSelectedEmployee(null);
                  }}
                  style={styles.modalCancelButton}
                />
                
                <Button
                  title="Save Salary Structure"
                  onPress={handleSubmit}
                  loading={createMutation.isPending}
                  style={styles.modalSaveButton}
                />
              </View>
            </>
          )}
        </ScrollView>
      </Modal>

      {/* Edit Salary Structure Modal */}
      <Modal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStructure(null);
        }}
        title="Edit Salary Structure"
      >
        <ScrollView style={styles.modalContent}>
          {selectedStructure && (
            <>
              <View style={styles.selectedEmployee}>
                <Text style={styles.selectedEmployeeName}>
                  {selectedStructure.employee.user.first_name} {selectedStructure.employee.user.last_name}
                </Text>
                <Text style={styles.selectedEmployeeNumber}>
                  {selectedStructure.employee.employee_number}
                </Text>
              </View>

              <TextInput
                label="Basic Salary *"
                value={formData.basic_salary}
                onChangeText={(text) => setFormData({ ...formData, basic_salary: text })}
                placeholder="Enter basic salary"
                keyboardType="decimal-pad"
                required
              />
              
              <TextInput
                label="Housing Allowance"
                value={formData.housing_allowance}
                onChangeText={(text) => setFormData({ ...formData, housing_allowance: text })}
                placeholder="Enter housing allowance"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Transport Allowance"
                value={formData.transport_allowance}
                onChangeText={(text) => setFormData({ ...formData, transport_allowance: text })}
                placeholder="Enter transport allowance"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Medical Allowance"
                value={formData.medical_allowance}
                onChangeText={(text) => setFormData({ ...formData, medical_allowance: text })}
                placeholder="Enter medical allowance"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Overtime Rate"
                value={formData.overtime_rate}
                onChangeText={(text) => setFormData({ ...formData, overtime_rate: text })}
                placeholder="e.g., 1.5"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Night Shift Rate"
                value={formData.night_shift_rate}
                onChangeText={(text) => setFormData({ ...formData, night_shift_rate: text })}
                placeholder="e.g., 2.0"
                keyboardType="decimal-pad"
              />
              
              <TextInput
                label="Payment Method"
                value={formData.payment_method}
                onChangeText={(text) => setFormData({ ...formData, payment_method: text })}
                placeholder="BANK or MPESA"
              />
              
              <TextInput
                label="Effective Date"
                value={formData.effective_date}
                onChangeText={(text) => setFormData({ ...formData, effective_date: text })}
                placeholder="YYYY-MM-DD"
              />
              
              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setShowEditModal(false);
                    setSelectedStructure(null);
                  }}
                  style={styles.modalCancelButton}
                />
                
                <Button
                  title="Save Changes"
                  onPress={handleSubmit}
                  loading={updateMutation.isPending}
                  style={styles.modalSaveButton}
                />
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
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
  mySalaryCard: {
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.lg,
  },
  mySalaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  mySalaryTitle: {
    marginLeft: Layout.spacing.md,
    flex: 1,
  },
  mySalaryName: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  mySalaryStatus: {
    fontSize: 14,
    color: THEME_COLORS.success,
    fontWeight: '500',
  },
  salaryBreakdown: {
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
  },
  salaryLabel: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
  },
  salaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.borderLight,
    paddingTop: Layout.spacing.sm,
    marginTop: Layout.spacing.xs,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.primaryBlue,
  },
  paymentInfo: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.borderLight,
    paddingTop: Layout.spacing.md,
  },
  paymentMethod: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  paymentDetail: {
    fontSize: 14,
    color: THEME_COLORS.textTertiary,
  },
  addCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  addCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addCardText: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  addCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  addCardSubtitle: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: Layout.spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  listContainer: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
  },
  structureCard: {
    padding: Layout.spacing.lg,
  },
  structureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.md,
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
  statusContainer: {
    marginLeft: Layout.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  salarySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  salaryItem: {
    alignItems: 'center',
  },
  salaryItemLabel: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  salaryItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
  },
  structureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.borderLight,
    paddingTop: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  actionText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  activateText: {
    fontSize: 14,
    color: THEME_COLORS.success,
    fontWeight: '500',
  },
  effectiveDate: {
    marginLeft: 'auto',
  },
  effectiveDateText: {
    fontSize: 12,
    color: THEME_COLORS.textTertiary,
  },
  modalContent: {
    maxHeight: 600,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  employeeList: {
    gap: Layout.spacing.sm,
  },
  employeeSelectCard: {
    backgroundColor: THEME_COLORS.white,
    borderRadius: 8,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.borderLight,
  },
  employeeSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.textPrimary,
    marginBottom: 2,
  },
  employeeSelectNumber: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 2,
  },
  employeeSelectDepartment: {
    fontSize: 12,
    color: THEME_COLORS.textTertiary,
  },
  selectedEmployee: {
    backgroundColor: THEME_COLORS.primaryBlue + '10',
    borderRadius: 8,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  backToSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.sm,
  },
  backToSelectText: {
    color: THEME_COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedEmployeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.textPrimary,
    marginBottom: 2,
  },
  selectedEmployeeNumber: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSaveButton: {
    flex: 2,
  },
});