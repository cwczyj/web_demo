'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceStatus {
  id: string;
  connected: boolean;
  last_communication_ms: number;
  error_count: number;
}

interface UseDeviceStatusReturn {
  devices: DeviceStatus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDeviceStatus(pollInterval: number = 10000): UseDeviceStatusReturn {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/proxy/devices/status');
      const result = await response.json();
      setDevices(result.devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [refresh, pollInterval]);

  return { devices, loading, error, refresh };
}