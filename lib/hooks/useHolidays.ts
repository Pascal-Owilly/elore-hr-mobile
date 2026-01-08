// lib/hooks/useHolidays.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_recurring: boolean;
  description?: string;
  organization_name?: string;
  day_of_week?: string;
}

interface CreateHolidayDto {
  name: string;
  date: string;
  year: number;
  is_recurring: boolean;
  description?: string;
}

interface UpdateHolidayDto extends Partial<CreateHolidayDto> {}

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from your Django backend
      const response = await api.get(API_ENDPOINTS.LEAVES.HOLIDAYS);
      setHolidays(response.data.results || response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch holidays');
      console.error('Error fetching holidays:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createHoliday = async (data: CreateHolidayDto): Promise<PublicHoliday> => {
    try {
      const response = await api.post(API_ENDPOINTS.LEAVES.HOLIDAYS, data);
      const newHoliday = response.data;
      
      setHolidays(prev => [...prev, newHoliday]);
      return newHoliday;
    } catch (error) {
      console.error('Error creating holiday:', error);
      throw error;
    }
  };

  const updateHoliday = async (id: string, data: UpdateHolidayDto): Promise<PublicHoliday> => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.LEAVES.HOLIDAYS}${id}/`, data);
      const updatedHoliday = response.data;
      
      setHolidays(prev => prev.map(h => h.id === id ? updatedHoliday : h));
      return updatedHoliday;
    } catch (error) {
      console.error('Error updating holiday:', error);
      throw error;
    }
  };

  const deleteHoliday = async (id: string): Promise<void> => {
    try {
      await api.delete(`${API_ENDPOINTS.LEAVES.HOLIDAYS}${id}/`);
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error('Error deleting holiday:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return {
    holidays,
    loading,
    error,
    refetch: fetchHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
};