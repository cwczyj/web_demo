'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Form, InputNumber, Button, Card, Row, Col, message, Space, Typography, Tag } from 'antd';
import { SendOutlined, SyncOutlined } from '@ant-design/icons';
import type { SignalValues } from '../hooks/useSignalValues';
import { usePolling } from '../hooks/usePolling';

const { Title, Text } = Typography;

interface WriteFormValues extends SignalValues {}

const POSITION_FIELDS = [
  { name: 'x_value', label: 'X Position', unit: 'mm', defaultValue: 0 },
  { name: 'y_value', label: 'Y Position', unit: 'mm', defaultValue: 0 },
  { name: 'z_value', label: 'Z Position', unit: 'mm', defaultValue: 0 },
];

const ROTATION_FIELDS = [
  { name: 'rx', label: 'Rotation X', unit: '°', defaultValue: 0 },
  { name: 'ry', label: 'Rotation Y', unit: '°', defaultValue: 0 },
  { name: 'rz', label: 'Rotation Z', unit: '°', defaultValue: 0 },
];

export default function WriteForm({ initialValues }: { initialValues?: SignalValues }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const previousValuesRef = useRef<SignalValues | null>(null);
  
  // 保持寄存器（WRITE_GROUP_NAME）的界面输入框每 30s 从读取的值中联动更新一次
  const syncFormWithValues = useCallback(() => {
    if (initialValues) {
      // 只有当值发生变化时才更新表单
      const hasChanged = !previousValuesRef.current || 
        initialValues.x_value !== previousValuesRef.current.x_value ||
        initialValues.y_value !== previousValuesRef.current.y_value ||
        initialValues.z_value !== previousValuesRef.current.z_value ||
        initialValues.rx !== previousValuesRef.current.rx ||
        initialValues.ry !== previousValuesRef.current.ry ||
        initialValues.rz !== previousValuesRef.current.rz;
      
      if (hasChanged) {
        form.setFieldsValue(initialValues);
        previousValuesRef.current = initialValues;
        setLastSyncTime(new Date());
      }
    }
  }, [initialValues, form]);
  
  const { start, stop, isActive } = usePolling(syncFormWithValues, 30000, true);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      previousValuesRef.current = initialValues;
      setLastSyncTime(new Date());
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: WriteFormValues) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/proxy/signals/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        message.success('Signal values written successfully');
        form.resetFields();
      } else {
        message.error(result.error || 'Failed to write signal values');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (field: { name: string; label: string; unit: string; defaultValue: number }) => (
    <Form.Item
      key={field.name}
      name={field.name}
      label={field.label}
      rules={[{ required: true, message: `Please input ${field.label}` }]}
      initialValue={field.defaultValue}
    >
      <InputNumber
        style={{ width: '100%' }}
        step={0.0001}
        placeholder={`Enter ${field.label}`}
        addonAfter={field.unit}
      />
    </Form.Item>
  );

  return (
    <Card
      title="Write Signal Values"
      extra={
        <Space>
          {isActive && (
            <Tag color="processing" icon={<SyncOutlined spin />}>
              Auto-sync (30s)
            </Tag>
          )}
          {lastSyncTime && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </Text>
          )}
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Title level={5}>Position (mm)</Title>
            {POSITION_FIELDS.map(renderInput)}
          </Col>
          <Col xs={24} md={12}>
            <Title level={5}>Rotation (degrees)</Title>
            {ROTATION_FIELDS.map(renderInput)}
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={loading}
            >
              Write Values
            </Button>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}