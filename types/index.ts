// Core Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id?: string;
  kra_pin?: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE';
  profile_image?: string;
  is_verified: boolean;
  date_joined: string;
}

export interface Employee {
  id: string;
  user_id: string;
  organization_id: string;
  employee_number: string;
  employment_type: 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'PROBATION' | 'INTERN';
  employment_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'RESIGNED' | 'RETIRED';
  job_title: string;
  department?: string;
  branch?: string;
  hire_date: string;
  basic_salary: number;
  monthly_gross_salary: number;
  mpesa_number?: string;
  bank_account_number?: string;
  is_active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  industry: string;
  email: string;
  phone: string;
  county: string;
  address: string;
  logo?: string;
  primary_color: string;
  secondary_color: string;
}

// Attendance Types
export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_location?: GeoLocation;
  check_out_location?: GeoLocation;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY';
  total_hours: number;
  overtime_hours: number;
  is_approved: boolean;
  is_within_geofence: boolean;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Geofence {
  id: string;
  organization_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  address: string;
}

// Payroll Types
export interface Payroll {
  id: string;
  employee_id: string;
  payroll_period_id: string;
  period_name: string;
  period_start: string;
  period_end: string;
  pay_date: string;
  
  // Earnings
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  overtime_pay: number;
  bonus: number;
  total_earnings: number;
  
  // Statutory Deductions (Kenya)
  nssf_employee: number;
  nhif: number;
  paye: number;
  helb: number;
  
  // Other Deductions
  loan_deduction: number;
  sacco_deduction: number;
  total_deductions: number;
  
  // Totals
  gross_salary: number;
  net_salary: number;
  
  // Status
  payment_status: 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'FAILED';
  payment_method: 'BANK' | 'MPESA' | 'CASH';
  mpesa_transaction_id?: string;
}

export interface PayrollPeriod {
  id: string;
  organization_id: string;
  name: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  status: 'DRAFT' | 'PROCESSING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CLOSED';
}

// Leave Types
export interface LeaveType {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  max_days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'TAKEN';
  applied_date: string;
  approved_date?: string;
  rejected_date?: string;
  rejection_reason?: string;
}

export interface LeaveBalance {
  leave_type_id: string;
  leave_type_name: string;
  total_entitled: number;
  taken: number;
  balance: number;
  year: number;
}

// Contract Types
export interface Contract {
  id: string;
  employee_id: string;
  contract_number: string;
  contract_type: 'PERMANENT' | 'FIXED_TERM' | 'PROBATION' | 'CASUAL' | 'INTERNSHIP';
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  title: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  basic_salary: number;
  total_package: number;
  employee_signature?: string;
  employer_signature?: string;
  is_signed: boolean;
  signed_date?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ATTENDANCE' | 'PAYROLL' | 'LEAVE';
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
    total_pages: number;
    current_page: number;
  };
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  organization?: Organization;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  device_id?: string;
}

export interface RegisterFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  confirm_password: string;
  national_id?: string;
  kra_pin?: string;
  organization_code?: string;
}

export interface AttendanceFormData {
  check_in_time: string;
  check_in_location: GeoLocation;
  photo_base64?: string;
  remarks?: string;
}

export interface LeaveRequestFormData {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  contact_number: string;
  supporting_document?: string;
}

// Offline Types
export interface OfflineAttendance {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  photo_base64?: string;
  is_synced: boolean;
  sync_attempts: number;
  sync_error?: string;
  created_at: string;
}

export interface OfflineSyncState {
  pendingAttendances: OfflineAttendance[];
  pendingRequests: any[];
  lastSync: string | null;
  isSyncing: boolean;
}

// Navigation Types
export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  
  // Main App
  Main: undefined;
  
  // Tabs
  Dashboard: undefined;
  Attendance: undefined;
  Payroll: undefined;
  Leaves: undefined;
  Contracts: undefined;
  Notifications: undefined;
  Profile: undefined;
  
  // Attendance Stack
  AttendanceHistory: undefined;
  AttendanceCheckIn: { location?: GeoLocation };
  AttendanceCheckOut: { attendanceId: string };
  
  // Payroll Stack
  PayrollList: undefined;
  PayrollDetail: { payrollId: string };
  PayslipView: { payrollId: string };
  
  // Leave Stack
  LeaveList: undefined;
  LeaveApply: undefined;
  LeaveDetail: { leaveId: string };
  LeaveBalance: undefined;
  
  // Contract Stack
  ContractList: undefined;
  ContractView: { contractId: string };
  ContractSign: { contractId: string };
  
  // Admin Stack
  AdminDashboard: undefined;
  EmployeeList: undefined;
  EmployeeDetail: { employeeId: string };
  BulkPayroll: undefined;
  Reports: undefined;
  
  // Settings
  Settings: undefined;
  ChangePassword: undefined;
  EditProfile: undefined;
};

// Theme Types
export interface Theme {
  colors: typeof Colors;
  layout: typeof Layout;
  isDark: boolean;
}

export type AppTheme = 'light' | 'dark' | 'system';