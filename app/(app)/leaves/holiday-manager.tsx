// app/(app)/leaves/holiday-manager.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { KenyaConstants } from '@/constants/KenyaConstants';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterButton } from '@/components/ui/FilterButton';
import { formatDate } from '@/lib/utils/format';

// Types
interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_recurring: boolean;
  description?: string;
  is_custom?: boolean;
}

function HolidayManagerScreen() {
  const router = useRouter();
  const { employee, user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [customHolidays, setCustomHolidays] = useState<Holiday[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Generate holidays from constants
  const generateHolidaysFromConstants = (year: number): Holiday[] => {
    const holidays: Holiday[] = [];
    
    // Add standard Kenyan holidays (recurring)
    KenyaConstants.publicHolidays2024.forEach(baseHoliday => {
      const date = new Date(baseHoliday.date);
      date.setFullYear(year);
      
      // Check if it's a fixed date holiday (like New Year's Day) or movable (like Easter)
      const isFixedDate = ![
        'Good Friday',
        'Easter Monday',
        'Idd-ul-Fitr',
        'Idd-ul-Adha',
      ].includes(baseHoliday.name);
      
      holidays.push({
        id: `kenya-${baseHoliday.name.toLowerCase().replace(/\s+/g, '-')}-${year}`,
        name: baseHoliday.name,
        date: date.toISOString().split('T')[0],
        year: year,
        is_recurring: isFixedDate,
        description: `Kenyan public holiday${isFixedDate ? ' (recurring)' : ''}`,
        is_custom: false,
      });
    });
    
    return holidays;
  };
  
  // Get all holidays (constants + custom)
  const allHolidays = useMemo(() => {
    const currentYear = selectedYear;
    const kenyaHolidays = generateHolidaysFromConstants(currentYear);
    const previousYearHolidays = generateHolidaysFromConstants(currentYear - 1);
    const nextYearHolidays = generateHolidaysFromConstants(currentYear + 1);
    
    // Combine all holidays
    const allHolidays = [
      ...kenyaHolidays,
      ...previousYearHolidays,
      ...nextYearHolidays,
      ...customHolidays,
    ];
    
    // Remove duplicates (by id)
    const uniqueHolidays = Array.from(
      new Map(allHolidays.map(holiday => [holiday.id, holiday])).values()
    );
    
    return uniqueHolidays.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [selectedYear, customHolidays]);
  
  // Filter holidays based on search and year
  const filteredHolidays = useMemo(() => {
    let filtered = [...allHolidays];
    
    // Filter by year
    if (yearFilter !== 'all') {
      const year = parseInt(yearFilter);
      filtered = filtered.filter(h => h.year === year);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(query) ||
        holiday.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allHolidays, searchQuery, yearFilter]);
  
  // Get unique years for filter
  const availableYears = useMemo(() => {
    const years = allHolidays.map(h => h.year);
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
    return uniqueYears;
  }, [allHolidays]);
  
  // Add custom holiday
  const handleAddCustomHoliday = () => {
    Alert.prompt(
      'Add Custom Holiday',
      'Enter holiday name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (name) => {
            if (name && name.trim()) {
              const newHoliday: Holiday = {
                id: `custom-${Date.now()}`,
                name: name.trim(),
                date: new Date().toISOString().split('T')[0],
                year: selectedYear,
                is_recurring: true,
                description: 'Custom company holiday',
                is_custom: true,
              };
              
              setCustomHolidays(prev => [...prev, newHoliday]);
              Alert.alert('Success', 'Custom holiday added');
            }
          },
        },
      ]
    );
  };
  
  // Delete custom holiday
  const handleDeleteHoliday = (holiday: Holiday) => {
    if (!holiday.is_custom) {
      Alert.alert('Cannot Delete', 'Standard Kenyan holidays cannot be deleted');
      return;
    }
    
    Alert.alert(
      'Delete Holiday',
      `Are you sure you want to delete "${holiday.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setCustomHolidays(prev => prev.filter(h => h.id !== holiday.id));
            Alert.alert('Success', 'Holiday deleted');
          }
        },
      ]
    );
  };
  
  // Toggle recurring status
  const handleToggleRecurring = (holiday: Holiday) => {
    if (!holiday.is_custom) {
      Alert.alert('Cannot Modify', 'Standard Kenyan holidays cannot be modified');
      return;
    }
    
    setCustomHolidays(prev => 
      prev.map(h => 
        h.id === holiday.id 
          ? { ...h, is_recurring: !h.is_recurring }
          : h
      )
    );
  };
  
  // Check if user has admin privileges
  const isAdmin = user?.is_staff || user?.is_superuser || false;
  
  // Render holiday item
  const renderHolidayItem = ({ item }: { item: Holiday }) => (
    <Card style={styles.holidayCard}>
      <View style={styles.holidayHeader}>
        <View style={styles.holidayInfo}>
          <Text style={styles.holidayName}>{item.name}</Text>
          <View style={styles.holidayMeta}>
            <Text style={styles.holidayDate}>
              {formatDate(item.date)} • Year {item.year}
            </Text>
            <Chip
              label={item.is_recurring ? 'Recurring' : 'One-time'}
              color={item.is_recurring ? Colors.success500 : Colors.info500}
              size="small"
              icon={item.is_recurring ? 'refresh-cw' : 'calendar'}
            />
            {item.is_custom && (
              <Chip
                label="Custom"
                color={Colors.secondary500}
                size="small"
                icon="briefcase"
              />
            )}
          </View>
        </View>
        
        {isAdmin && item.is_custom && (
          <View style={styles.holidayActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleRecurring(item)}
            >
              <Icon 
                name={item.is_recurring ? 'calendar' : 'refresh-cw'} 
                type="feather" 
                size={16} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteHoliday(item)}
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
          {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })}
        </Text>
        <Text style={styles.holidaySource}>
          {item.is_custom ? 'Company Holiday' : 'Kenyan Public Holiday'}
        </Text>
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
    </View>
  );
  
  // Summary statistics
  const summaryStats = useMemo(() => {
    const kenyaHolidays = allHolidays.filter(h => !h.is_custom);
    const customHolidays = allHolidays.filter(h => h.is_custom);
    const recurring = allHolidays.filter(h => h.is_recurring);
    
    return {
      total: allHolidays.length,
      kenya: kenyaHolidays.length,
      custom: customHolidays.length,
      recurring: recurring.length,
    };
  }, [allHolidays]);
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Public Holidays</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCustomHoliday}
          >
            <Icon name="plus" type="feather" size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Custom</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Year Selector */}
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
      
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summaryStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summaryStats.kenya}</Text>
              <Text style={styles.statLabel}>Kenyan</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summaryStats.custom}</Text>
              <Text style={styles.statLabel}>Custom</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summaryStats.recurring}</Text>
              <Text style={styles.statLabel}>Recurring</Text>
            </View>
          </View>
        </Card>
      </View>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search holidays..."
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.yearFilters}
        >
          <FilterButton
            label="All Years"
            isActive={yearFilter === 'all'}
            onPress={() => setYearFilter('all')}
          />
          {availableYears.map(year => (
            <FilterButton
              key={year}
              label={year.toString()}
              isActive={yearFilter === year.toString()}
              onPress={() => setYearFilter(year.toString())}
            />
          ))}
        </ScrollView>
      </View>
      
      {/* Holidays List */}
      <FlatList
        data={filteredHolidays}
        renderItem={renderHolidayItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Icon name="info" type="feather" size={16} color={Colors.info500} />
        <Text style={styles.infoText}>
          Kenyan public holidays are pre-loaded. Admins can add custom company holidays.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  statsContainer: {
    padding: Layout.spacing.lg,
    paddingTop: 0,
  },
  statsCard: {
    padding: Layout.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryBlue500,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filtersContainer: {
    padding: Layout.spacing.lg,
    paddingTop: 0,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  yearFilters: {
    marginTop: Layout.spacing.md,
  },
  listContent: {
    padding: Layout.spacing.lg,
    paddingTop: 0,
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
  holidaySource: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info50,
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.info100,
  },
  infoText: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
    fontSize: 12,
    color: Colors.info700,
  },
});

export default HolidayManagerScreen;