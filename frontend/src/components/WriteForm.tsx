'use client';

import { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Card, Row, Col, message, Space, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { SignalValues } from '../hooks/useSignalValues';

const { Title } = Typography;

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

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
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
    <Card title="Write Signal Values">
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