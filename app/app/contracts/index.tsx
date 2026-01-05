import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { Icon } from '@/components/ui/Icon';

export default function ContractsScreen() {
  const { user } = useAuth();

  const contracts = [
    { id: 1, title: 'Employment Contract', type: 'Permanent', status: 'Active', signed: true, date: '2024-01-15' },
    { id: 2, title: 'Confirmation Letter', type: 'Confirmation', status: 'Active', signed: true, date: '2024-04-15' },
    { id: 3, title: 'NDA Agreement', type: 'Confidentiality', status: 'Pending', signed: false, date: '2024-12-01' },
    { id: 4, title: 'Probation Contract', type: 'Probation', status: 'Expired', signed: true, date: '2023-12-15' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#059669';
      case 'Pending': return '#D97706';
      case 'Expired': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contracts</Text>
        <Text style={styles.subtitle}>Manage your employment contracts</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
            <Icon name="add" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionText}>New Contract</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
            <Icon name="download" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionText}>Download All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
            <Icon name="search" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Contracts List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Contracts</Text>
        {contracts.map((contract) => (
          <TouchableOpacity key={contract.id} style={styles.contractCard}>
            <View style={styles.contractHeader}>
              <View>
                <Text style={styles.contractTitle}>{contract.title}</Text>
                <View style={styles.contractMeta}>
                  <Text style={styles.contractType}>{contract.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) }]}>
                    <Text style={styles.statusText}>{contract.status}</Text>
                  </View>
                </View>
              </View>
              {contract.signed ? (
                <View style={styles.signedBadge}>
                  <Icon name="check-circle" size={24} color="#059669" />
                </View>
              ) : (
                <TouchableOpacity style={styles.signButton}>
                  <Text style={styles.signButtonText}>Sign</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.contractFooter}>
              <Text style={styles.contractDate}>
                Date: {new Date(contract.date).toLocaleDateString()}
              </Text>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Active Contracts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1</Text>
          <Text style={styles.statLabel}>Pending Signatures</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Signed</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#1E40AF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#93C5FD',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  contractMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractType: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  signedBadge: {
    padding: 4,
  },
  signButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  contractFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contractDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
