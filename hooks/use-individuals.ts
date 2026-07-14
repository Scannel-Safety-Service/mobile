import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api';

export interface Individual {
  id: string;
  name: string;
  userId: string;
}

export function useIndividuals(enabled = true) {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndividuals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/individuals?archived=false&limit=100');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch individuals');
      }
      
      let list: Individual[] = [];
      if (result.data) {
        if (Array.isArray(result.data)) {
          list = result.data;
        } else if (result.data.items && Array.isArray(result.data.items)) {
          list = result.data.items;
        }
      }
      setIndividuals(list);
    } catch (err: any) {
      console.error('Error fetching individuals:', err);
      setError(err.message || 'Failed to load individuals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchIndividuals();
    }
  }, [fetchIndividuals, enabled]);

  return {
    individuals,
    isLoading,
    error,
    refetch: fetchIndividuals,
  };
}
