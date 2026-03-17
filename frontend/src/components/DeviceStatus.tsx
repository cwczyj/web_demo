'use client';

import { Card, Badge, Descriptions, Button, Space, Spin, Typography } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useDeviceStatus } from '../hooks/useDeviceStatus';

const { Text } = Typography;

export default function DeviceStatus() {
  const { devices, loading, error, refresh } = useDeviceStatus();

  const device = devices[0]; // We expect only one device: Test-Dobot

  const formatLastCommunication = (ms: number) => {
    if (ms < 1000) return `${ms}ms ago`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s ago`;
    return `${(ms / 60000).toFixed(1)}min ago`;
  };

  return (
    <Card
      title="Device Status"
      className="device-status"
      extra={
        <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
          Refresh
        </Button>
      }
    >
      {loading && !device ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : error ? (
        <Text type="danger">{error}</Text>
      ) : device ? (
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Device ID">
            <Text strong>{device.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge
              status={device.connected ? 'success' : 'error'}
              text={
                <Space>
                  {device.connected ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  )}
                  <Text>{device.connected ? 'Connected' : 'Disconnected'}</Text>
                </Space>
              }
            />
          </Descriptions.Item>
          <Descriptions.Item label="Last Communication">
            <Text type="secondary">
              {formatLastCommunication(device.last_communication_ms)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Error Count">
            <Text type={device.error_count > 0 ? 'danger' : 'secondary'}>
              {device.error_count}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Text type="secondary">No devices found</Text>
      )}
    </Card>
  );
}