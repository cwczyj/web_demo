'use client';

import { useState } from 'react';
import { Card, Button, Dropdown, Modal, Input, Space, List, Typography, Popconfirm, Empty } from 'antd';
import { SaveOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import type { SignalValues } from '../hooks/useSignalValues';
import { usePresets } from '../hooks/usePresets';

const { Text } = Typography;

interface PointPresetsProps {
  currentValues?: SignalValues;
  onLoadPreset: (values: SignalValues) => void;
}

export default function PointPresets({ currentValues, onLoadPreset }: PointPresetsProps) {
  const { presets, savePreset, deletePreset, loadPreset } = usePresets();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSave = () => {
    if (presetName.trim() && currentValues) {
      savePreset(presetName.trim(), currentValues);
      setPresetName('');
      setSaveModalOpen(false);
    }
  };

  const handleLoad = (id: string) => {
    const values = loadPreset(id);
    if (values) {
      onLoadPreset(values);
    }
  };

  return (
    <>
      <Card
        title="Point Presets"
        size="small"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setSaveModalOpen(true)}
            disabled={!currentValues}
          >
            Save Current
          </Button>
        }
      >
        {presets.length === 0 ? (
          <Empty description="No presets saved" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={presets}
            renderItem={(preset) => (
              <List.Item
                actions={[
                  <Button key="load" type="link" size="small" onClick={() => handleLoad(preset.id)}>
                    Load
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="Delete this preset?"
                    onConfirm={() => deletePreset(preset.id)}
                  >
                    <Button type="link" danger size="small">
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Text strong>{preset.name}</Text>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="Save Point Preset"
        open={saveModalOpen}
        onOk={handleSave}
        onCancel={() => setSaveModalOpen(false)}
        okText="Save"
        okButtonProps={{ disabled: !presetName.trim() }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Preset Name</Text>
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Enter preset name"
            onPressEnter={handleSave}
          />
        </Space>
      </Modal>
    </>
  );
}