'use client';

import { useState, useCallback } from 'react';

export interface SignalValues {
  x_value: number;
  y_value: number;
  z_value: number;
  rx: number;
  ry: number;
  rz: number;
}

interface UseSignalValuesReturn {
  data: SignalValues | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSignalValues(): UseSignalValuesReturn {
  const [data, setData] = useState<SignalValues | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/proxy/signals/read');
      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch signal values');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch };
}