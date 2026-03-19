'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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

// 独立的数值显示组件，只在自己的值变化时重新渲染
interface SignalValueCellProps {
  data: SignalValues | null;
  keyName: keyof SignalValues;
  loading: boolean;
  error: string | null;
  initialValue: boolean;
}

const SignalValueCell = ({ data, keyName, loading, error, initialValue }: SignalValueCellProps) => {
  const prevValueRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  
  useEffect(() => {
    if (error) return;
    
    const newValue = data?.[keyName];
    if (newValue !== undefined && newValue !== prevValueRef.current) {
      prevValueRef.current = newValue;
      setDisplayValue(newValue);
    }
  }, [data, keyName, error]);

  if (loading && !initialValue) return <Spin size="small" />;
  if (error) return <Tag color="error">Error</Tag>;
  if (typeof displayValue === 'number') {
    return <Text code>{displayValue.toFixed(4)}</Text>;
  }
  if (loading) return <Spin size="small" />;
  return <Tag color="warning">N/A</Tag>;
};

export default function SignalValuesTable({ onSyncToWriteForm }: { onSyncToWriteForm?: (values: SignalValues) => void }) {
  const { data, loading, error, refetch } = useSignalValues();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const previousDataRef = useRef<SignalValues | null>(null);
  
  // 输入寄存器（READ_GROUP_NAME）只在点击按钮时读取
  const { start, stop, isActive } = usePolling(refetch, 1000, false);

  // 只在数据实际变化时更新时间戳
  useEffect(() => {
    if (data) {
      setInitialLoad(false);
      
      const hasChanged = !previousDataRef.current ||
        data.x_value !== previousDataRef.current.x_value ||
        data.y_value !== previousDataRef.current.y_value ||
        data.z_value !== previousDataRef.current.z_value ||
        data.rx !== previousDataRef.current.rx ||
        data.ry !== previousDataRef.current.ry ||
        data.rz !== previousDataRef.current.rz;
      
      if (hasChanged) {
        previousDataRef.current = data;
        setLastUpdated(new Date());
      }
    }
  }, [data]);

  const handleRefresh = () => {
    refetch();
    start();
  };

  const handleSyncToWriteForm = async () => {
    setSyncLoading(true);
    try {
      // 如果没有数据或数据未加载，先刷新一次
      if (!data || !previousDataRef.current) {
        await refetch();
      }
      // 使用最新的数据（优先使用刚获取的 data，否则使用之前缓存的数据）
      const currentData = data || previousDataRef.current;
      if (currentData) {
        onSyncToWriteForm?.(currentData);
      } else {
        // 如果还是没有数据，再尝试获取一次
        await refetch();
      }
    } finally {
      setSyncLoading(false);
    }
  };

  // 使用 useMemo 缓存列定义，避免每次渲染都重新创建
  const columns = useMemo(() => [
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
      render: (key: string, record: SignalField) => (
        <SignalValueCell
          data={data}
          keyName={record.key as keyof SignalValues}
          loading={loading}
          error={error}
          initialValue={!initialLoad}
        />
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit: string) => <Text type="secondary">{unit}</Text>,
    },
  ], [data, loading, error, initialLoad]);

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
          <Button
            onClick={handleSyncToWriteForm}
            loading={syncLoading}
            disabled={!data && !previousDataRef.current}
          >
            Sync to WriteForm
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
        loading={false}
        rowKey="key"
      />
    </Card>
  );
}
