import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttendanceRecord } from '@lib/services/attendance';

interface OfflineAttendance {
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

interface AttendanceState {
  // Current day
  todaysAttendance: AttendanceRecord | null;
  
  // Offline queue
  offlineAttendances: OfflineAttendance[];
  
  // Statistics
  monthlyStats: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    overtime: number;
  } | null;

  // Actions
  setTodaysAttendance: (attendance: AttendanceRecord | null) => void;
  addOfflineAttendance: (attendance: OfflineAttendance) => void;
  updateOfflineAttendance: (id: string, updates: Partial<OfflineAttendance>) => void;
  removeOfflineAttendance: (id: string) => void;
  clearOfflineAttendances: () => void;
  setMonthlyStats: (stats: AttendanceState['monthlyStats']) => void;
  markAttendanceAsSynced: (id: string) => void;
  incrementSyncAttempts: (id: string) => void;
  setSyncError: (id: string, error: string) => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      // Initial state
      todaysAttendance: null,
      offlineAttendances: [],
      monthlyStats: null,

      // Actions
      setTodaysAttendance: (attendance) => set({ todaysAttendance: attendance }),

      addOfflineAttendance: (attendance) => 
        set((state) => ({
          offlineAttendances: [...state.offlineAttendances, attendance],
        })),

      updateOfflineAttendance: (id, updates) =>
        set((state) => ({
          offlineAttendances: state.offlineAttendances.map((att) =>
            att.id === id ? { ...att, ...updates } : att
          ),
        })),

      removeOfflineAttendance: (id) =>
        set((state) => ({
          offlineAttendances: state.offlineAttendances.filter(
            (att) => att.id !== id
          ),
        })),

      clearOfflineAttendances: () => set({ offlineAttendances: [] }),

      setMonthlyStats: (stats) => set({ monthlyStats: stats }),

      markAttendanceAsSynced: (id) => {
        const attendance = get().offlineAttendances.find((att) => att.id === id);
        if (attendance) {
          get().updateOfflineAttendance(id, {
            is_synced: true,
            sync_error: undefined,
          });
        }
      },

      incrementSyncAttempts: (id) => {
        const attendance = get().offlineAttendances.find((att) => att.id === id);
        if (attendance) {
          get().updateOfflineAttendance(id, {
            sync_attempts: attendance.sync_attempts + 1,
          });
        }
      },

      setSyncError: (id, error) => {
        get().updateOfflineAttendance(id, {
          sync_error: error,
        });
      },
    }),
    {
      name: 'attendance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        offlineAttendances: state.offlineAttendances,
        monthlyStats: state.monthlyStats,
      }),
    }
  )
);