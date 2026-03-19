'use client';

import { useEffect, useState } from 'react';
import { Table, Card, Button, Spin, Typography, Space, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useSignalValues, type SignalValues } from '../hooks/useSignalValues';
import { usePolling } from '../hooks/usePolling';
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface SignalField {
  key: string;
  field: string;
  description: string;
  unit: string;
}

const SIGNAL_FIELDS: SignalField[] = [
  { key: 'x_value', field: 'x_value', description: 'X Position', unit: 'mm' },
  { key: 'y_value', field: 'y_value', description: 'Y Position', unit: 'mm' },
  { key: 'z_value', field: 'z_value', description: 'Z Position', unit: 'mm' },
  { key: 'rx', field: 'rx', description: 'Rotation X', unit: '°' },
  { key: 'ry', field: 'ry', description: 'Rotation Y', unit: '°' },
  { key: 'rz', field: 'rz', description: 'Rotation Z', unit: '°' },
];

export default function SignalValuesTable({ onValuesChange }: { onValuesChange?: (values: SignalValues) => void }) {
  const { data, loading, error, refetch } = useSignalValues();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  // 输入寄存器（READ_GROUP_NAME）每 10ms 读取一次
  const { start, stop, isActive } = usePolling(refetch, 10, true);

  useEffect(() => {
    if (data) {
      setInitialLoad(false);
      setLastUpdated(new Date());
      onValuesChange?.(data);
    }
  }, [data, onValuesChange]);

  const handleRefresh = () => {
    refetch();
  };

  const columns = [
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      render: (field: string) => <Text strong>{field}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Value',
      dataIndex: 'key',
      key: 'value',
      render: (key: string) => {
        if (loading || initialLoad) return <Spin size="small" />;
        if (error) return <Tag color="error">Error</Tag>;
        const value = data?.[key as keyof SignalValues];
        if (typeof value === 'number') {
          return <Text code>{value.toFixed(4)}</Text>;
        }
        return <Tag color="warning">N/A</Tag>;
      },
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit: string) => <Text type="secondary">{unit}</Text>,
    },
  ];

  return (
    <Card
      title="Position & Euler Values"
      className="signal-values-table"
      extra={
        <Space>
          {isActive && (
            <Tag color="processing" icon={<ReloadOutlined spin />}>
              Auto-refresh
            </Tag>
          )}
          {lastUpdated && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
          <Button
            icon={isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={isActive ? stop : start}
          >
            {isActive ? 'Pause' : 'Resume'}
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {error && (
        <div style={{ marginBottom: 16 }}>
          <Tag color="error">{error}</Tag>
        </div>
      )}
      <Table
        dataSource={SIGNAL_FIELDS}
        columns={columns}
        pagination={false}
        size="small"
        loading={initialLoad}
      />
    </Card>
  );
}