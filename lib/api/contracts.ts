import { api, offlineApi } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// Types based on Django models
export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  contract_type: 'PERM' | 'FIXED' | 'PROB' | 'CAS' | 'INT' | 'CONS';
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
  employee_name: string;
  employee: string;
  organization: string;
  organization_name: string;
  job_title: string;
  department: string;
  reporting_to: string;
  start_date: string;
  end_date: string | null;
  probation_period_days: number;
  notice_period_days: number;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  total_package: number;
  work_location: string;
  working_hours: string;
  leave_entitlement: string;
  employee_signature: string | null;
  employee_signed_date: string | null;
  employer_signature: string | null;
  employer_signed_by: string | null;
  employer_signed_by_name: string | null;
  contract_file: string | null;
  signed_contract_file: string | null;
  terms_and_conditions: string;
  special_clauses: string | null;
  is_signed: boolean;
  is_active: boolean;
  days_remaining: number | null;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  title: string;
  contract_type: string;
  preamble: string | null;
  terms_and_conditions: string;
  special_clauses: string | null;
  placeholders: string[];
  is_active: boolean;
  is_default: boolean;
  organization_name: string;
}

export interface ContractAmendment {
  id: string;
  contract_number: string;
  amendment_number: string;
  reason: string;
  changes: any;
  effective_date: string;
  employee_name: string;
  amendment_file: string | null;
  created_at: string;
}

export interface ContractSignatureData {
  signature: string; // base64 encoded
  signature_type: 'employee' | 'employer';
  ip_address?: string;
}

export interface GenerateContractRequest {
  template_id: string;
  employee_ids: string[];
  variables?: Record<string, any>;
}

export interface ContractFilters {
  status?: string;
  contract_type?: string;
  organization?: string;
  employee?: string;
  search?: string;
  ordering?: string;
}

export const contractsApi = {
  // Get contracts list
  getContracts: async (filters?: ContractFilters) => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = params.toString() 
      ? `${API_ENDPOINTS.CONTRACTS.CONTRACTS}?${params.toString()}`
      : API_ENDPOINTS.CONTRACTS.CONTRACTS;
    
    return api.get(url);
  },

  // Get single contract
  getContract: async (id: string) => {
    return api.get(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/`);
  },

  // Create contract
  createContract: async (data: Partial<Contract>) => {
    return api.post(API_ENDPOINTS.CONTRACTS.CONTRACTS, data);
  },

  // Update contract
  updateContract: async (id: string, data: Partial<Contract>) => {
    return api.patch(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/`, data);
  },

  // Delete contract
  deleteContract: async (id: string) => {
    return api.delete(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/`);
  },

  // Sign contract
  signContract: async (id: string, signatureData: ContractSignatureData) => {
    return api.post(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/sign/`, signatureData);
  },

  // Cancel contract
  cancelContract: async (id: string) => {
    return api.post(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/cancel/`);
  },

  // Get contract status
  getContractStatus: async (id: string) => {
    return api.get(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/status/`);
  },

  // Generate contract from template
  generateFromTemplate: async (data: GenerateContractRequest) => {
    return api.post(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}generate_from_template/`, data);
  },

  // Preview contract HTML
  previewContract: async (id: string) => {
    return api.get(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/preview/`);
  },

  // Download contract PDF
  downloadContractPDF: async (id: string, signed: boolean = false) => {
    const contract = await contractsApi.getContract(id);
    const fileUrl = signed 
      ? contract.data.signed_contract_file 
      : contract.data.contract_file;
    
    if (!fileUrl) {
      throw new Error('Contract file not available');
    }
    
    return fileUrl;
  },

  // Get contract templates
  getTemplates: async (organizationId?: string) => {
    const params = new URLSearchParams();
    if (organizationId) {
      params.append('organization', organizationId);
    }
    
    const url = params.toString()
      ? `${API_ENDPOINTS.CONTRACTS.TEMPLATES}?${params.toString()}`
      : API_ENDPOINTS.CONTRACTS.TEMPLATES;
    
    return api.get(url);
  },

  // Get contract amendments
  getAmendments: async (contractId?: string) => {
    const params = new URLSearchParams();
    if (contractId) {
      params.append('contract', contractId);
    }
    
    const url = params.toString()
      ? `${API_ENDPOINTS.CONTRACTS.AMENDMENTS}?${params.toString()}`
      : API_ENDPOINTS.CONTRACTS.AMENDMENTS;
    
    return api.get(url);
  },

  // Get bulk contracts
  getBulkContracts: async () => {
    return api.get(API_ENDPOINTS.CONTRACTS.BULK_CONTRACTS);
  },

  // Get dashboard stats
  getDashboardStats: async (organizationId: string) => {
    const params = new URLSearchParams();
    params.append('organization', organizationId);
    
    return api.get(`${API_ENDPOINTS.CONTRACTS.BULK_CONTRACTS}dashboard/?${params.toString()}`);
  },
};

// Hook for offline support
export const offlineContractsApi = {
  signContract: async (id: string, signatureData: ContractSignatureData) => {
    return offlineApi.post(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/sign/`, signatureData);
  },

  createContract: async (data: Partial<Contract>) => {
    return offlineApi.post(API_ENDPOINTS.CONTRACTS.CONTRACTS, data);
  },

  updateContract: async (id: string, data: Partial<Contract>) => {
    return offlineApi.patch(`${API_ENDPOINTS.CONTRACTS.CONTRACTS}${id}/`, data);
  },
};