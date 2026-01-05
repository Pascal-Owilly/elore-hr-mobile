import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Employee, Organization } from '@types';

interface AuthState {
  // Auth state
  user: User | null;
  employee: Employee | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (data: {
    user: User;
    employee?: Employee;
    organization?: Organization;
    accessToken: string;
    refreshToken?: string;
  }) => void;
  setUser: (user: User) => void;
  setEmployee: (employee: Employee) => void;
  setOrganization: (organization: Organization) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      employee: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setAuth: (data) => set({
        user: data.user,
        employee: data.employee || null,
        organization: data.organization || null,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      }),

      setUser: (user) => set({ user }),

      setEmployee: (employee) => set({ employee }),

      setOrganization: (organization) => set({ organization }),

      setTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken: refreshToken || null,
      }),

      clearAuth: () => set({
        user: null,
        employee: null,
        organization: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        employee: state.employee,
        organization: state.organization,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);