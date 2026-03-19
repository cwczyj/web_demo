'use client';

import { useState, useCallback } from 'react';
import { Row, Col, Typography } from 'antd';
import SignalValuesTable from '../components/SignalValuesTable';
import WriteForm from '../components/WriteForm';
import OperationHistory from '../components/OperationHistory';
import DeviceStatus from '../components/DeviceStatus';
import PointPresets from '../components/PointPresets';
import ErrorBanner from '../components/ErrorBanner';
import type { SignalValues } from '../hooks/useSignalValues';

const { Title } = Typography;

export default function Home() {
  const [currentValues, setCurrentValues] = useState<SignalValues | undefined>();

  const handleLoadPreset = useCallback((values: SignalValues) => {
    setCurrentValues(values);
  }, []);

  const handleSyncToWriteForm = useCallback((values: SignalValues) => {
    setCurrentValues(values);
  }, []);

  return (
    <ErrorBanner>
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        <Title level={2}>RoboPLC Middleware Dashboard</Title>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <DeviceStatus />
              </Col>
              <Col xs={24}>
                <SignalValuesTable onSyncToWriteForm={handleSyncToWriteForm} />
              </Col>
              <Col xs={24}>
                <OperationHistory />
              </Col>
            </Row>
          </Col>
          
          <Col xs={24} lg={8}>
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <WriteForm currentValues={currentValues} />
              </Col>
              <Col xs={24}>
                <PointPresets currentValues={currentValues} onLoadPreset={handleLoadPreset} />
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </ErrorBanner>
  );
}
