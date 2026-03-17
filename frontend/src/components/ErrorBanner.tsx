'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Alert, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date | null;
}

const ConnectionContext = createContext<ConnectionStatus>({
  isConnected: true,
  lastChecked: null,
});

export function useConnectionStatus() {
  return useContext(ConnectionContext);
}

interface ErrorBannerProps {
  children: ReactNode;
}

export default function ErrorBanner({ children }: ErrorBannerProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/proxy/health');
        const data = await response.json();
        setIsConnected(data.status === 'ok');
        setLastChecked(new Date());
      } catch {
        setIsConnected(false);
        setLastChecked(new Date());
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ConnectionContext.Provider value={{ isConnected, lastChecked }}>
      {!isConnected && (
        <Alert
          message="Connection Lost"
          description="Unable to connect to the proxy server. Please check that the proxy is running."
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      {children}
    </ConnectionContext.Provider>
  );
}