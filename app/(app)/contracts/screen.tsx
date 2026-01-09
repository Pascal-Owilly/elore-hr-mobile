import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  Dimensions 
} from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { useContracts } from '@/lib/contexts/ContractContext';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { router } from 'expo-router';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function ContractsScreen() {
  const { user, employee } = useAuth();
  const { 
    contracts, 
    isLoading, 
    loadContracts, 
    stats,
    getDashboardStats 
  } = useContracts();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContracts();
    if (employee?.organization?.id) {
      getDashboardStats(employee.organization.id);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    if (employee?.organization?.id) {
      await getDashboardStats(employee.organization.id);
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#059669';
      case 'PENDING': return '#D97706';
      case 'DRAFT': return '#6B7280';
      case 'EXPIRED': return '#DC2626';
      case 'TERMINATED': return '#EF4444';
      case 'RENEWED': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getContractTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'PERM': 'Permanent',
      'FIXED': 'Fixed Term',
      'PROB': 'Probation',
      'CAS': 'Casual',
      'INT': 'Internship',
      'CONS': 'Consultancy',
    };
    return typeMap[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const navigateToContract = (contractId: string) => {
    router.push(`/(app)/contracts/${contractId}`);
  };

  const navigateToCreate = () => {
    router.push('/(app)/contracts/create');
  };

  const navigateToSign = (contractId: string) => {
    router.push(`/(app)/contracts/${contractId}/sign`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Contracts</Text>
            <Text style={styles.subtitle}>Manage your employment contracts</Text>
          </View>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={navigateToCreate}
          >
            <Icon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <Card style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.stats?.total_contracts || 0}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#059669' }]}>
                  {stats.stats?.active_contracts || 0}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#D97706' }]}>
                  {stats.stats?.pending_signature || 0}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#DC2626' }]}>
                  {stats.stats?.expiring_soon || 0}
                </Text>
                <Text style={styles.statLabel}>Expiring</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => loadContracts({ status: 'PENDING' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#D97706' }]}>
                <Icon name="edit-document" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Pending</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => loadContracts({ status: 'ACTIVE' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#059669' }]}>
                <Icon name="check-circle" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Active</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => loadContracts({ ordering: '-start_date' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                <Icon name="calendar" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Recent</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => loadContracts({ contract_type: 'FIXED' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
                <Icon name="document" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Fixed Term</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contracts List */}
        <View style={styles.contractsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Contracts</Text>
            <TouchableOpacity onPress={() => loadContracts()}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading && contracts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text>Loading contracts...</Text>
            </View>
          ) : contracts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="document" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No contracts found</Text>
              <Text style={styles.emptySubtext}>
                {employee ? 'Start by creating a new contract' : 'Complete your profile to view contracts'}
              </Text>
            </View>
          ) : (
            contracts.map((contract) => (
              <TouchableOpacity 
                key={contract.id}
                style={styles.contractCard}
                onPress={() => navigateToContract(contract.id)}
              >
                <View style={styles.contractHeader}>
                  <View style={styles.contractTitleSection}>
                    <Text style={styles.contractNumber}>{contract.contract_number}</Text>
                    <Text style={styles.contractTitle}>{contract.title}</Text>
                  </View>
                  <Badge 
                    text={contract.status}
                    color={getStatusColor(contract.status)}
                  />
                </View>
                
                <View style={styles.contractDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Icon name="work" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {getContractTypeLabel(contract.contract_type)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="calendar-today" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {format(new Date(contract.start_date), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Icon name="attach-money" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {formatCurrency(contract.total_package)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="location-on" size={16} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {contract.work_location}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.contractFooter}>
                  <View style={styles.signatureStatus}>
                    {contract.is_signed ? (
                      <View style={styles.signedStatus}>
                        <Icon name="check-circle" size={16} color="#059669" />
                        <Text style={styles.signedText}>Fully Signed</Text>
                      </View>
                    ) : contract.employee_signature ? (
                      <View style={styles.partialStatus}>
                        <Icon name="schedule" size={16} color="#D97706" />
                        <Text style={styles.partialText}>Awaiting Employer</Text>
                      </View>
                    ) : contract.employer_signature ? (
                      <View style={styles.partialStatus}>
                        <Icon name="schedule" size={16} color="#D97706" />
                        <Text style={styles.partialText}>Awaiting Your Signature</Text>
                      </View>
                    ) : (
                      <View style={styles.unsignedStatus}>
                        <Icon name="warning" size={16} color="#DC2626" />
                        <Text style={styles.unsignedText}>Not Signed</Text>
                      </View>
                    )}
                  </View>
                  
                  {!contract.is_signed && !contract.employee_signature && (
                    <TouchableOpacity 
                      style={styles.signNowButton}
                      onPress={() => navigateToSign(contract.id)}
                    >
                      <Text style={styles.signNowText}>Sign Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    width: (width - 60) / 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  contractsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contractTitleSection: {
    flex: 1,
    marginRight: 8,
  },
  contractNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contractDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  contractFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  signatureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signedText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 4,
    fontWeight: '500',
  },
  partialStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partialText: {
    fontSize: 14,
    color: '#D97706',
    marginLeft: 4,
    fontWeight: '500',
  },
  unsignedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unsignedText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 4,
    fontWeight: '500',
  },
  signNowButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  signNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});