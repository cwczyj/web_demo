'use client';

import { Card, List, Tag, Button, Space, Typography, Empty, Spin } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { useOperationHistory } from '../hooks/useOperationHistory';

const { Text } = Typography;

export default function OperationHistory() {
  const { history, loading, error, clearHistory, refresh } = useOperationHistory();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValues = (values?: { x_value: number; y_value: number; z_value: number; rx: number; ry: number; rz: number }) => {
    if (!values) return '-';
    const x = typeof values.x_value === 'number' ? values.x_value.toFixed(2) : '0.00';
    const y = typeof values.y_value === 'number' ? values.y_value.toFixed(2) : '0.00';
    const z = typeof values.z_value === 'number' ? values.z_value.toFixed(2) : '0.00';
    return `X:${x} Y:${y} Z:${z}`;
  };

  return (
    <Card
      title="Operation History"
      className="operation-history"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            Refresh
          </Button>
          <Button icon={<ClearOutlined />} onClick={clearHistory} danger>
            Clear
          </Button>
        </Space>
      }
    >
      {error && <Tag color="error">{error}</Tag>}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : history.length === 0 ? (
        <Empty description="No operations recorded" />
      ) : (
        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Tag color={item.type === 'write' ? 'blue' : 'green'}>
                    {item.type.toUpperCase()}
                  </Tag>
                }
                title={
                  <Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                    {item.success ? (
                      <Tag color="success">Success</Tag>
                    ) : (
                      <Tag color="error">Failed</Tag>
                    )}
                  </Space>
                }
                description={
                  item.error ? (
                    <Text type="danger">{item.error}</Text>
                  ) : (
                    <Text code>{formatValues(item.values)}</Text>
                  )
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}