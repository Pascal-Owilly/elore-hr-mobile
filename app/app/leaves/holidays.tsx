// app/app/leaves/holidays.tsx

import React, { useState, useMemo, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterButton } from '@/components/ui/FilterButton';
import { formatDate } from '@/lib/utils/format';
import { useHolidays } from '@/lib/hooks/useHolidays';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// Types matching your Django model
interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_recurring: boolean;
  description?: string;
  organization_name?: string;
  day_of_week?: string;
}

interface HolidayFormData {
  name: string;
  date: string;
  year: number;
  is_recurring: boolean;
  description?: string;
}

function HolidayScreen() {
  const { user } = useAuth();
  const { 
    holidays, 
    loading, 
    error, 
    refetch,
    createHoliday,
    updateHoliday,
    deleteHoliday 
  } = useHolidays();

  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [recurringFilter, setRecurringFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<PublicHoliday | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form state
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    is_recurring: false,
    description: '',
  });

  // Check if user has admin privileges
  const isAdmin = user?.is_staff || user?.is_superuser || false;

  // Get filtered holidays
  const filteredHolidays = useMemo(() => {
    let filtered = [...(holidays || [])];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(query) ||
        holiday.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by year
    if (yearFilter !== 'all') {
      const year = parseInt(yearFilter);
      filtered = filtered.filter(h => h.year === year);
    }
    
    // Filter by recurring status
    if (recurringFilter !== 'all') {
      const isRecurring = recurringFilter === 'recurring';
      filtered = filtered.filter(h => h.is_recurring === isRecurring);
    }
    
    return filtered.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [holidays, searchQuery, yearFilter, recurringFilter]);

  // Get unique years for filter
  const availableYears = useMemo(() => {
    if (!holidays) return [];
    const years = holidays.map(h => h.year);
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
    return uniqueYears;
  }, [holidays]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      year: new Date().getFullYear(),
      is_recurring: false,
      description: '',
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle edit
  const handleEdit = (holiday: PublicHoliday) => {
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      year: holiday.year,
      is_recurring: holiday.is_recurring,
      description: holiday.description || '',
    });
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = async (holiday: PublicHoliday) => {
    Alert.alert(
      'Delete Holiday',
      `Are you sure you want to delete "${holiday.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHoliday(holiday.id);
              Alert.alert('Success', 'Holiday deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete holiday');
            }
          }
        },
      ]
    );
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a holiday name');
      return;
    }

    if (!formData.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    try {
      if (showAddModal) {
        await createHoliday({
          name: formData.name.trim(),
          date: formData.date,
          year: formData.year,
          is_recurring: formData.is_recurring,
          description: formData.description?.trim() || '',
        });
        
        setShowAddModal(false);
        resetForm();
        Alert.alert('Success', 'Holiday added successfully');
        
      } else if (showEditModal && selectedHoliday) {
        await updateHoliday(selectedHoliday.id, {
          name: formData.name.trim(),
          date: formData.date,
          year: formData.year,
          is_recurring: formData.is_recurring,
          description: formData.description?.trim() || '',
        });
        
        setShowEditModal(false);
        setSelectedHoliday(null);
        resetForm();
        Alert.alert('Success', 'Holiday updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save holiday');
    }
  };

  // Header component
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Public Holidays</Text>
      {isAdmin && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" type="feather" size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Add Holiday</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Year selector component
  const renderYearSelector = () => (
    <View style={styles.yearSelector}>
      <TouchableOpacity
        onPress={() => setSelectedYear(prev => prev - 1)}
        style={styles.yearNavButton}
      >
        <Icon name="chevron-left" type="feather" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      
      <Text style={styles.currentYear}>{selectedYear}</Text>
      
      <TouchableOpacity
        onPress={() => setSelectedYear(prev => prev + 1)}
        style={styles.yearNavButton}
      >
        <Icon name="chevron-right" type="feather" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  // Filters component
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search holidays..."
      />
      
      <View style={styles.filterRow}>
        <FlatList
          data={['all', ...availableYears.map(y => y.toString())]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <FilterButton
              label={item === 'all' ? 'All Years' : item}
              isActive={yearFilter === item}
              onPress={() => setYearFilter(item)}
            />
          )}
          contentContainerStyle={styles.yearFilters}
        />
        
        <View style={styles.typeFilters}>
          <FilterButton
            label="All"
            isActive={recurringFilter === 'all'}
            onPress={() => setRecurringFilter('all')}
            size="small"
          />
          <FilterButton
            label="Recurring"
            isActive={recurringFilter === 'recurring'}
            onPress={() => setRecurringFilter('recurring')}
            size="small"
          />
          <FilterButton
            label="One-time"
            isActive={recurringFilter === 'one-time'}
            onPress={() => setRecurringFilter('one-time')}
            size="small"
          />
        </View>
      </View>
    </View>
  );

  // Render holiday item
  const renderHolidayItem = ({ item }: { item: PublicHoliday }) => (
    <Card style={styles.holidayCard}>
      <View style={styles.holidayHeader}>
        <View style={styles.holidayInfo}>
          <Text style={styles.holidayName}>{item.name}</Text>
          <View style={styles.holidayMeta}>
            <Text style={styles.holidayDate}>
              {formatDate(item.date)} ({item.year})
            </Text>
            {item.is_recurring && (
              <Chip
                label="Recurring"
                color={Colors.success500}
                size="small"
                icon="refresh-cw"
              />
            )}
          </View>
        </View>
        {isAdmin && (
          <View style={styles.holidayActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Icon name="edit-2" type="feather" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Icon name="trash-2" type="feather" size={16} color={Colors.danger500} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {item.description && (
        <Text style={styles.holidayDescription}>{item.description}</Text>
      )}
      
      <View style={styles.holidayFooter}>
        <Text style={styles.holidayDay}>
          {item.day_of_week || new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })}
        </Text>
        {item.organization_name && (
          <Text style={styles.holidayOrganization}>
            {item.organization_name}
          </Text>
        )}
      </View>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="calendar" type="feather" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No holidays found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'Try a different search term' : 'No holidays for selected filters'}
      </Text>
      {isAdmin && (
        <Button
          title="Add First Holiday"
          onPress={() => setShowAddModal(true)}
          style={styles.emptyStateButton}
        />
      )}
    </View>
  );

  // Show loading state
  if (loading && !refreshing) {
    return <LoadingState message="Loading holidays..." />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorState 
        message="Failed to load holidays"
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Main content with header at top and scrollable list */}
        <View style={styles.content}>
          {renderHeader()}
          {renderYearSelector()}
          {renderFilters()}
          
          {/* Holidays List */}
          <FlatList
            data={filteredHolidays}
            renderItem={renderHolidayItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              filteredHolidays.length === 0 && styles.emptyListContent
            ]}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors.primaryBlue500]}
                tintColor={Colors.primaryBlue500}
              />
            }
          />
        </View>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showAddModal ? 'Add New Holiday' : 'Edit Holiday'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedHoliday(null);
                    resetForm();
                  }}
                >
                  <Icon name="x" type="feather" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {/* Holiday Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Holiday Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Enter holiday name"
                  />
                </View>

                {/* Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Date *</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      // You can implement a date picker here
                      Alert.alert('Date Picker', 'Implement date picker here');
                    }}
                  >
                    <Text style={styles.dateInputText}>
                      {formatDate(formData.date)}
                    </Text>
                    <Icon name="calendar" type="feather" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Recurring */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Recurring Holiday</Text>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      is_recurring: !prev.is_recurring 
                    }))}
                  >
                    <View style={[
                      styles.checkbox,
                      formData.is_recurring && styles.checkboxChecked
                    ]}>
                      {formData.is_recurring && (
                        <Icon name="check" type="feather" size={14} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      This holiday occurs every year
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Enter holiday description"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedHoliday(null);
                    resetForm();
                  }}
                />
                <Button
                  title={showAddModal ? 'Add Holiday' : 'Save Changes'}
                  onPress={handleSubmit}
                  disabled={!formData.name.trim()}
                />
              </View>
            </Card>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: Colors.primaryBlue500,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    marginLeft: Layout.spacing.xs,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  yearNavButton: {
    padding: Layout.spacing.md,
  },
  currentYear: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginHorizontal: Layout.spacing.xl,
  },
  filtersContainer: {
    padding: Layout.spacing.lg,
    paddingTop: 0,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterRow: {
    marginTop: Layout.spacing.md,
  },
  yearFilters: {
    marginBottom: Layout.spacing.sm,
    paddingRight: Layout.spacing.md,
  },
  typeFilters: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  listContent: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  holidayCard: {
    marginBottom: Layout.spacing.md,
  },
  holidayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.sm,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  holidayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    flexWrap: 'wrap',
  },
  holidayDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  holidayActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.xs,
  },
  holidayDescription: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Layout.spacing.sm,
  },
  holidayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Layout.spacing.sm,
  },
  holidayDay: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  holidayOrganization: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: Colors.primaryBlue500,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
  },
  modalCard: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalContent: {
    paddingBottom: Layout.spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  formGroup: {
    marginBottom: Layout.spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    backgroundColor: Colors.white,
  },
  dateInputText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: Layout.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryBlue500,
    borderColor: Colors.primaryBlue500,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});

export default HolidayScreen;