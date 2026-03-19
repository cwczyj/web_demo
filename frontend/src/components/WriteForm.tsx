'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Form, InputNumber, Button, Card, Row, Col, message, Space, Typography, Tag } from 'antd';
import { SendOutlined, SyncOutlined, PlusOutlined, MinusOutlined, ReadOutlined } from '@ant-design/icons';
import type { SignalValues } from '../hooks/useSignalValues';

const { Title, Text } = Typography;

interface WriteFormProps {
  currentValues?: SignalValues;
}

interface WriteFormValues extends SignalValues {}

const POSITION_FIELDS = [
  { name: 'x_value', label: 'X Position', unit: 'mm', step: 1 },
  { name: 'y_value', label: 'Y Position', unit: 'mm', step: 1 },
  { name: 'z_value', label: 'Z Position', unit: 'mm', step: 1 },
];

const ROTATION_FIELDS = [
  { name: 'rx', label: 'Rotation X', unit: '°', step: 1 },
  { name: 'ry', label: 'Rotation Y', unit: '°', step: 1 },
  { name: 'rz', label: 'Rotation Z', unit: '°', step: 1 },
];

export default function WriteForm({ currentValues }: WriteFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const writeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValuesRef = useRef<WriteFormValues | null>(null);
  const writeInProgressRef = useRef(false);
  const previousValuesRef = useRef<SignalValues | undefined>(undefined);

  // 当 currentValues 变化时更新表单
  useEffect(() => {
    if (currentValues) {
      // 检查值是否真的变化了，避免重复更新
      const hasChanged = !previousValuesRef.current ||
        currentValues.x_value !== previousValuesRef.current.x_value ||
        currentValues.y_value !== previousValuesRef.current.y_value ||
        currentValues.z_value !== previousValuesRef.current.z_value ||
        currentValues.rx !== previousValuesRef.current.rx ||
        currentValues.ry !== previousValuesRef.current.ry ||
        currentValues.rz !== previousValuesRef.current.rz;
      
      if (hasChanged) {
        form.setFieldsValue(currentValues);
        setLastSyncTime(new Date());
        previousValuesRef.current = currentValues;
        message.success('Synced values from SignalValuesTable');
      }
    }
  }, [currentValues, form]);

  // 从读取的寄存器值更新表单（由父组件触发）
  const syncFormFromRead = useCallback(() => {
    if (currentValues) {
      form.setFieldsValue(currentValues);
      setLastSyncTime(new Date());
      message.success('Synced values from SignalValuesTable');
    } else {
      message.warning('No values to sync. Please click "Refresh" first.');
    }
  }, [currentValues, form]);

  // 获取当前表单值
  const getCurrentFormValues = useCallback((): WriteFormValues => {
    return {
      x_value: form.getFieldValue('x_value') || 0,
      y_value: form.getFieldValue('y_value') || 0,
      z_value: form.getFieldValue('z_value') || 0,
      rx: form.getFieldValue('rx') || 0,
      ry: form.getFieldValue('ry') || 0,
      rz: form.getFieldValue('rz') || 0,
    };
  }, [form]);

  // 以 500ms 间隔写入寄存器
  const startWriting = useCallback((values: WriteFormValues) => {
    if (writeIntervalRef.current) {
      clearInterval(writeIntervalRef.current);
    }

    setIsWriting(true);
    message.info('Start writing to register every 500ms...');

    // 立即写入一次
    writeSignalValues(values);

    // 然后每 500ms 写入一次
    writeIntervalRef.current = setInterval(() => {
      // 每次写入时获取最新的表单值
      const currentValues = getCurrentFormValues();
      writeSignalValues(currentValues);
    }, 100);
  }, [getCurrentFormValues]);

  const stopWriting = useCallback(() => {
    if (writeIntervalRef.current) {
      clearInterval(writeIntervalRef.current);
      writeIntervalRef.current = null;
    }
    setIsWriting(false);
    writeInProgressRef.current = false;
    message.success('Stopped writing to register');
  }, []);

  const writeSignalValues = async (values: WriteFormValues) => {
    if (writeInProgressRef.current) {
      // 如果已有写入在进行中，保存待处理的值
      pendingValuesRef.current = values;
      return;
    }

    writeInProgressRef.current = true;
    try {
      const response = await fetch('/api/proxy/signals/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!result.success) {
        message.error(result.error || 'Failed to write signal values');
      }
    } catch (err) {
      console.error('Write error:', err);
    } finally {
      writeInProgressRef.current = false;
      
      // 如果有待处理的写入，立即执行
      if (pendingValuesRef.current) {
        const pending = pendingValuesRef.current;
        pendingValuesRef.current = null;
        writeSignalValues(pending);
      }
    }
  };

  const handleSubmit = async (values: WriteFormValues) => {
    setLoading(true);
    
    try {
      await startWriting(values);
      message.success('Writing signal values every 500ms');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // 增减数值的按钮处理 - 支持长按连续触发
  const handleValueChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatFieldRef = useRef<{ fieldName: string; delta: number } | null>(null);
  
  // 清除所有定时器
  const clearAllTimers = useCallback(() => {
    if (handleValueChangeTimeoutRef.current) {
      clearTimeout(handleValueChangeTimeoutRef.current);
      handleValueChangeTimeoutRef.current = null;
    }
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    repeatFieldRef.current = null;
  }, []);

  // 执行单次值变化
  const executeValueChange = useCallback((fieldName: string, delta: number) => {
    const currentVal = form.getFieldValue(fieldName) || 0;
    const newValue = Number(currentVal) + delta;
    form.setFieldValue(fieldName, newValue);
    
    // 如果正在写入状态，立即写入新值
    if (isWriting) {
      const allValues = getCurrentFormValues();
      writeSignalValues(allValues);
    }
  }, [form, isWriting, getCurrentFormValues]);

  // 鼠标/触摸按下时开始连续触发
  const handleButtonMouseDown = useCallback((fieldName: string, delta: number) => {
    clearAllTimers();
    
    // 立即执行一次
    executeValueChange(fieldName, delta);
    
    // 保存当前字段信息
    repeatFieldRef.current = { fieldName, delta };
    
    // 500ms 后开始连续触发
    handleValueChangeTimeoutRef.current = setTimeout(() => {
      // 开始每 100ms 触发一次
      repeatTimerRef.current = setInterval(() => {
        if (repeatFieldRef.current) {
          executeValueChange(repeatFieldRef.current.fieldName, repeatFieldRef.current.delta);
        }
      }, 50);
    }, 50);
  }, [clearAllTimers, executeValueChange]);

  // 鼠标/触摸释放时停止连续触发
  const handleButtonMouseUp = useCallback(() => {
    clearAllTimers();
  }, [clearAllTimers]);

  const renderInput = (field: { name: string; label: string; unit: string; step: number }) => (
    <Form.Item
      key={field.name}
      name={field.name}
      label={field.label}
      rules={[{ required: true, message: `Please input ${field.label}` }]}
      initialValue={0}
    >
      <InputNumber
        style={{ width: '100%' }}
        step={field.step}
        placeholder={`Enter ${field.label}`}
        addonAfter={field.unit}
        controls={false}
      />
    </Form.Item>
  );

  const renderInputWithButtons = (field: { name: string; label: string; unit: string; step: number }) => {
    const currentValue = form.getFieldValue(field.name) || 0;
    
    return (
      <Form.Item
        key={field.name}
        name={field.name}
        label={field.label}
        rules={[{ required: true, message: `Please input ${field.label}` }]}
        initialValue={0}
        extra={
          <Space size="small" style={{ marginTop: 4 }}>
            <Button
              size="small"
              icon={<MinusOutlined />}
              onMouseDown={() => handleButtonMouseDown(field.name, -field.step)}
              onMouseUp={handleButtonMouseUp}
              onMouseLeave={handleButtonMouseUp}
              onTouchStart={(e) => { e.preventDefault(); handleButtonMouseDown(field.name, -field.step); }}
              onTouchEnd={handleButtonMouseUp}
            >
              -{field.step}
            </Button>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onMouseDown={() => handleButtonMouseDown(field.name, field.step)}
              onMouseUp={handleButtonMouseUp}
              onMouseLeave={handleButtonMouseUp}
              onTouchStart={(e) => { e.preventDefault(); handleButtonMouseDown(field.name, field.step); }}
              onTouchEnd={handleButtonMouseUp}
            >
              +{field.step}
            </Button>
          </Space>
        }
      >
        <InputNumber
          style={{ width: '100%' }}
          step={field.step}
          placeholder={`Enter ${field.label}`}
          addonAfter={field.unit}
          controls={false}
          readOnly
        />
      </Form.Item>
    );
  };

  return (
    <Card
      title="Write Signal Values"
      extra={
        <Space>
          {isWriting && (
            <Tag color="processing" icon={<SyncOutlined spin />}>
              Writing (500ms)
            </Tag>
          )}
          {lastSyncTime && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </Text>
          )}
          <Button
            icon={<ReadOutlined />}
            onClick={syncFormFromRead}
          >
            Sync from Read Values
          </Button>
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
            {POSITION_FIELDS.map(renderInputWithButtons)}
          </Col>
          <Col xs={24} md={12}>
            <Title level={5}>Rotation (degrees)</Title>
            {ROTATION_FIELDS.map(renderInputWithButtons)}
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={loading || isWriting}
              disabled={isWriting}
            >
              Start Writing (500ms interval)
            </Button>
            {isWriting ? (
              <Button danger onClick={stopWriting}>
                Stop Writing
              </Button>
            ) : null}
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}