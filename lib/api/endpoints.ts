// API Endpoints configuration based on your Django URLs
export const API_ENDPOINTS = {
  // Authentication & Users (from users/urls.py)
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    REFRESH_TOKEN: '/auth/token/refresh/',
    CHANGE_PASSWORD: '/auth/change-password/',
    RESET_PASSWORD: '/auth/reset-password/',
    RESET_PASSWORD_CONFIRM: '/auth/reset-password/confirm/',
    USER_PROFILE: '/auth/me/', // Note: This might be '/employees/me/' based on EmployeeProfileView
    USER_DETAIL: (id: string) => `/users/users/${id}/`,
    USERS_LIST: '/users/users/',
  },

  // Employees (from employees/urls.py)
  EMPLOYEES: {
    BASE: '/employees/employees/',
    PROFILE: '/employees/me/',
    DASHBOARD: '/employees/dashboard/',
    BULK_CREATE: '/employees/bulk-create/',
    DOCUMENTS: '/employees/documents/',
    EMERGENCY_CONTACTS: '/employees/emergency-contacts/',
    EDUCATION: '/employees/education/',
    WORK_EXPERIENCE: '/employees/work-experience/',
  },

  // Attendance (from attendance/urls.py)
  ATTENDANCE: {
    CHECK_IN: '/attendance/check-in/',
    CHECK_OUT: '/attendance/check-out/',
    TODAY: '/attendance/today/',
    MONTHLY: '/attendance/monthly/',
    LIST: '/attendance/list/',
    SUMMARY: '/attendance/summary/',
    OFFLINE: '/attendance/offline/',
    VERIFY_GEOFENCE: '/attendance/verify-geofence/',
  },

  // Leaves (from leaves/urls.py)
  LEAVES: {
    TYPES: '/leaves/types/',
    REQUESTS: '/leaves/requests/',
    BALANCES: '/leaves/balances/',
    APPROVALS: '/leaves/approvals/',
    HOLIDAYS: '/leaves/holidays/',
    POLICIES: '/leaves/policies/',
    DASHBOARD: '/leaves/dashboard/',
    KENYA_RULES: '/leaves/kenya-rules/',
    CALENDAR: '/leaves/calendar/',
    REPORT: '/leaves/report/',
  },

  // Payroll (from payroll/urls.py)
  PAYROLL: {
    PERIODS: '/payroll/periods/',
    LIST: '/payroll/list/',
    DETAIL: (id: string) => `/payroll/${id}/`,
    EMPLOYEE: '/payroll/employee/',
    CALCULATE: '/payroll/calculate/',
    PROCESS: '/payroll/process/',
    MPESA_PAYMENT: '/payroll/mpesa-payment/',
    STATUTORY_CALCULATION: '/payroll/statutory/',
    REPORT: '/payroll/report/',
  },

  // Contracts (from contracts/urls.py)
  CONTRACTS: {
    CONTRACTS: '/contracts/contracts/',
    TEMPLATES: '/contracts/templates/',
    AMENDMENTS: '/contracts/amendments/',
    BULK_CONTRACTS: '/contracts/bulk-contracts/',
    DASHBOARD: '/contracts/dashboard/',
  },

  // Organizations (from organizations/urls.py)
  ORGANIZATIONS: {
    ORGANIZATIONS: '/organizations/organizations/',
    DEPARTMENTS: '/organizations/departments/',
    BRANCHES: '/organizations/branches/',
    SETTINGS: (id: string) => `/organizations/organizations/${id}/settings/`,
    DEPARTMENT_EMPLOYEES: (id: string) => `/organizations/departments/${id}/employees/`,
    BRANCH_GEOFENCE: (id: string) => `/organizations/branches/${id}/geofence/`,
  },

  // Notifications (from notifications/urls.py)
  NOTIFICATIONS: {
    NOTIFICATIONS: '/notifications/notifications/',
    PREFERENCES: '/notifications/preferences/',
    TEMPLATES: '/notifications/templates/',
    ANNOUNCEMENTS: '/notifications/announcements/',
    DEVICES: '/notifications/devices/',
    BULK: '/notifications/bulk/',
    SETTINGS: '/notifications/settings/',
  },

  // Reports (from reports/urls.py)
  REPORTS: {
    TEMPLATES: '/reports/templates/',
    GENERATED: '/reports/generated/',
    SCHEDULES: '/reports/schedules/',
    DASHBOARDS: '/reports/dashboards/',
    WIDGETS: '/reports/widgets/',
    STATS: '/reports/stats/',
    QUICK_REPORTS: '/reports/quick-reports/',
    ATTENDANCE_REPORT: '/reports/attendance/',
    LEAVE_REPORT: '/reports/leave/',
  },
} as const;

// API URL Builder utility
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  let url = endpoint;
  
  if (params) {
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
  }
  
  return url;
};

// Type-safe endpoint access
export type ApiEndpoint = keyof typeof API_ENDPOINTS;