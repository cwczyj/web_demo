'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePollingReturn {
  start: () => void;
  stop: () => void;
  isActive: boolean;
}

export function usePolling(
  callback: () => void,
  interval: number = 5000,
  isActive: boolean = true
): UsePollingReturn {
  const [active, setActive] = useState(isActive);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Execute immediately on start
    callbackRef.current();

    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, interval]);

  return { start, stop, isActive: active };
}
