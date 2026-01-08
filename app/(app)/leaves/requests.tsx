// app/(app)/leaves/requests.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterButton } from '@/components/ui/FilterButton';
import { leaveApi } from '@/lib/api/client';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

// Define types for better TypeScript support
interface LeaveRequest {
  id: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  applied_date: string;
  approved_by: any[];
  contact_address?: string;
}

interface ApiResponse {
  count: number;
  results: LeaveRequest[];
  next: string | null;
  previous: string | null;
}

function LeaveRequestsScreen() {
  const router = useRouter();
  const { employee } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  console.log('🚀 LeaveRequestsScreen rendering, employee:', employee?.id);

  // Fetch leave requests
  const { 
    data: apiResponse, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useQuery<ApiResponse>({
    queryKey: ['leaveRequests', employee?.id, statusFilter],
    queryFn: async () => {
      console.log('📡 Fetching leave requests...');
      
      const params: any = {};
      if (employee?.id) {
        params.employee = employee.id;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      console.log('API params:', params);
      const response = await leaveApi.getLeaveRequests(params);
      console.log('API response received, results:', response.data?.results?.length || 0);
      return response.data;
    },
    enabled: !!employee?.id,
  });

  // Extract leave requests from paginated response
  const leaveRequests = useMemo(() => {
    return apiResponse?.results || [];
  }, [apiResponse]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return Colors.success500;
      case 'PENDING': return Colors.warning500;
      case 'REJECTED': return Colors.danger500;
      case 'CANCELLED': return Colors.gray500;
      case 'TAKEN': return Colors.info500;
      case 'DRAFT': return Colors.secondary500;
      default: return Colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'check-circle';
      case 'PENDING': return 'clock';
      case 'REJECTED': return 'x-circle';
      case 'CANCELLED': return 'x';
      case 'TAKEN': return 'calendar-check';
      case 'DRAFT': return 'edit';
      default: return 'file-text';
    }
  };

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Drafts', value: 'DRAFT' },
  ];

  // Filter by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return leaveRequests;
    
    const query = searchQuery.toLowerCase();
    return leaveRequests.filter((request) => {
      return (
        request.leave_type_name?.toLowerCase().includes(query) ||
        request.reason?.toLowerCase().includes(query) ||
        request.contact_address?.toLowerCase().includes(query)
      );
    });
  }, [leaveRequests, searchQuery]);

  // Group by status
  const groupedRequests = useMemo(() => {
    const groups: Record<string, LeaveRequest[]> = {};
    
    filteredRequests.forEach((request) => {
      const status = request.status || 'UNKNOWN';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(request);
    });
    
    return groups;
  }, [filteredRequests]);

  const sections = useMemo(() => {
    return Object.entries(groupedRequests).map(([status, requests]) => ({
      title: status,
      data: requests,
    }));
  }, [groupedRequests]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Leave Requests</Text>
        </View>
        <LoadingState message="Loading leave requests..." />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: Colors.danger500 }]}>
          <Text style={styles.headerTitle}>My Leave Requests</Text>
        </View>
        <ErrorState 
          message={error?.message || "Failed to load leave requests"} 
          onRetry={refetch}
        />
      </View>
    );
  }

  console.log('✅ Data loaded, leaveRequests:', leaveRequests.length);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Leave Requests</Text>
        <TouchableOpacity
          style={styles.newRequestButton}
          onPress={() => router.push('/leaves/apply')}
        >
          <Icon name="plus" type="feather" size={20} color={Colors.white} />
          <Text style={styles.newRequestText}>New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Debug info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Requests: {leaveRequests.length} • 
            Employee: {employee?.id?.substring(0, 8)} • 
            Filter: {statusFilter}
          </Text>
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search requests..."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {statusFilters.map((filter) => (
            <FilterButton
              key={filter.value}
              label={filter.label}
              isActive={statusFilter === filter.value}
              onPress={() => setStatusFilter(filter.value)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      {leaveRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="inbox" type="feather" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>No leave requests</Text>
          <Text style={styles.emptyStateText}>
            {statusFilter === 'all' 
              ? "You haven't applied for any leave yet."
              : `No ${statusFilter.toLowerCase()} leave requests.`}
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push('/leaves/apply')}
          >
            <Text style={styles.emptyStateButtonText}>Apply for Leave</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {title} ({groupedRequests[title]?.length || 0})
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.requestCard}
              onPress={() => router.push(`/leaves/request/${item.id}`)}
            >
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.leaveType}>{item.leave_type_name}</Text>
                  <Text style={styles.dates}>
                    {formatDate(item.start_date)} - {formatDate(item.end_date)}
                  </Text>
                </View>
                <Chip
                  label={item.status}
                  color={getStatusColor(item.status)}
                  icon={getStatusIcon(item.status)}
                />
              </View>

              <Text style={styles.reason} numberOfLines={2}>
                {item.reason}
              </Text>

              <View style={styles.requestFooter}>
                <View style={styles.footerItem}>
                  <Icon name="calendar" type="feather" size={12} color={Colors.textSecondary} />
                  <Text style={styles.footerText}>{item.total_days} days</Text>
                </View>
                <View style={styles.footerItem}>
                  <Icon name="clock" type="feather" size={12} color={Colors.textSecondary} />
                  <Text style={styles.footerText}>
                    {formatRelativeTime(item.applied_date)}
                  </Text>
                </View>
                {item.approved_by && item.approved_by.length > 0 && (
                  <View style={styles.footerItem}>
                    <Icon name="user-check" type="feather" size={12} color={Colors.textSecondary} />
                    <Text style={styles.footerText}>
                      {item.approved_by.length} approval{item.approved_by.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="search" type="feather" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No matching requests</Text>
              <Text style={styles.emptyStateText}>
                Try changing your search or filters
              </Text>
            </View>
          }
        />
      )}
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
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  newRequestText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
    marginLeft: Layout.spacing.xs,
  },
  filtersContainer: {
    padding: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingRight: Layout.spacing.lg,
  },
  debugContainer: {
    backgroundColor: Colors.warning100,
    padding: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning300,
  },
  debugText: {
    fontSize: 10,
    color: Colors.warning700,
    textAlign: 'center',
  },
  listContent: {
    padding: Layout.spacing.lg,
    flexGrow: 1,
  },
  sectionHeader: {
    marginBottom: Layout.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.sm,
  },
  requestInfo: {
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dates: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reason: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.sm,
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.lg,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
  emptyStateButton: {
    backgroundColor: Colors.primaryBlue500,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
});

export default LeaveRequestsScreen;