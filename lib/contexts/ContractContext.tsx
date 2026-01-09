import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { contractsApi, Contract, ContractFilters } from '@/lib/api/contracts';
import { useAuth } from '@/lib/hooks/useAuth';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert, Linking } from 'react-native'; // Use Linking instead

interface ContractContextType {
  contracts: Contract[];
  isLoading: boolean;
  error: string | null;
  filters: ContractFilters;
  selectedContract: Contract | null;
  stats: any;
  
  // Actions
  loadContracts: (newFilters?: ContractFilters) => Promise<void>;
  loadContract: (id: string) => Promise<void>;
  signContract: (contractId: string, signature: string, type: 'employee' | 'employer') => Promise<void>;
  downloadContract: (contractId: string, signed?: boolean) => Promise<void>;
  previewContract: (contractId: string) => Promise<string>;
  updateFilters: (newFilters: ContractFilters) => void;
  clearSelected: () => void;
  getContractStatus: (contractId: string) => Promise<any>;
  getDashboardStats: (organizationId: string) => Promise<void>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, employee } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContractFilters>({});
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [stats, setStats] = useState<any>(null);

  const loadContracts = useCallback(async (newFilters?: ContractFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const appliedFilters = newFilters || filters;
      
      // If no organization filter, add user's organization
      if (!appliedFilters.organization && employee?.organization?.id) {
        appliedFilters.organization = employee.organization.id;
      }
      
      const response = await contractsApi.getContracts(appliedFilters);
      setContracts(response.data.results || response.data);
      setFilters(appliedFilters);
    } catch (err: any) {
      setError(err.message || 'Failed to load contracts');
      console.error('Error loading contracts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, employee]);

  const loadContract = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await contractsApi.getContract(id);
      setSelectedContract(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contract');
      console.error('Error loading contract:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signContract = useCallback(async (contractId: string, signature: string, type: 'employee' | 'employer') => {
    try {
      setIsLoading(true);
      
      const signatureData = {
        signature,
        signature_type: type,
      };
      
      await contractsApi.signContract(contractId, signatureData);
      
      // Refresh the contract
      await loadContract(contractId);
      
      Alert.alert('Success', 'Contract signed successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to sign contract');
      Alert.alert('Error', 'Failed to sign contract');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadContract]);

  const downloadContract = useCallback(async (contractId: string, signed: boolean = false) => {
    try {
      setIsLoading(true);
      
      const fileUrl = await contractsApi.downloadContractPDF(contractId, signed);
      
      if (!fileUrl) {
        throw new Error('Contract file not available');
      }
      
      // For now, just open the URL in browser
      // In production, you would want to download and share properly
      const canOpen = await Linking.canOpenURL(fileUrl);
      if (canOpen) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open PDF file');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to download contract');
      Alert.alert('Error', 'Failed to download contract');
      console.error('Error downloading contract:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const previewContract = useCallback(async (contractId: string): Promise<string> => {
    try {
      const response = await contractsApi.previewContract(contractId);
      return response.data.html;
    } catch (err: any) {
      setError(err.message || 'Failed to preview contract');
      throw err;
    }
  }, []);

  const updateFilters = useCallback((newFilters: ContractFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearSelected = useCallback(() => {
    setSelectedContract(null);
  }, []);

  const getContractStatus = useCallback(async (contractId: string) => {
    try {
      const response = await contractsApi.getContractStatus(contractId);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get contract status');
      throw err;
    }
  }, []);

  const getDashboardStats = useCallback(async (organizationId: string) => {
    try {
      const response = await contractsApi.getDashboardStats(organizationId);
      setStats(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats');
      console.error('Error loading dashboard stats:', err);
    }
  }, []);

  const value: ContractContextType = {
    contracts,
    isLoading,
    error,
    filters,
    selectedContract,
    stats,
    loadContracts,
    loadContract,
    signContract,
    downloadContract,
    previewContract,
    updateFilters,
    clearSelected,
    getContractStatus,
    getDashboardStats,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
};