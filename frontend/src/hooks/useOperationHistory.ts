'use client';

import { useState, useEffect, useCallback } from 'react';

interface HistoryEntry {
  id: number;
  timestamp: string;
  type: 'read' | 'write';
  values?: {
    x_value: number;
    y_value: number;
    z_value: number;
    rx: number;
    ry: number;
    rz: number;
  };
  success: boolean;
  error?: string;
}

interface UseOperationHistoryReturn {
  history: HistoryEntry[];
  loading: boolean;
  error: string | null;
  clearHistory: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useOperationHistory(): UseOperationHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/proxy/signals/history');
      const result = await response.json();
      setHistory(result.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await fetch('/api/proxy/signals/history', { method: 'DELETE' });
      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, loading, error, clearHistory, refresh };
}