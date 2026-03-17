'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PointPreset {
  id: string;
  name: string;
  values: {
    x_value: number;
    y_value: number;
    z_value: number;
    rx: number;
    ry: number;
    rz: number;
  };
  createdAt: string;
}

const STORAGE_KEY = 'roboplc-point-presets';

interface UsePresetsReturn {
  presets: PointPreset[];
  savePreset: (name: string, values: PointPreset['values']) => void;
  deletePreset: (id: string) => void;
  loadPreset: (id: string) => PointPreset['values'] | null;
}

export function usePresets(): UsePresetsReturn {
  const [presets, setPresets] = useState<PointPreset[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch {
        setPresets([]);
      }
    }
  }, []);

  const saveToStorage = useCallback((newPresets: PointPreset[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    setPresets(newPresets);
  }, []);

  const savePreset = useCallback((name: string, values: PointPreset['values']) => {
    const newPreset: PointPreset = {
      id: Date.now().toString(),
      name,
      values,
      createdAt: new Date().toISOString(),
    };
    saveToStorage([newPreset, ...presets]);
  }, [presets, saveToStorage]);

  const deletePreset = useCallback((id: string) => {
    saveToStorage(presets.filter(p => p.id !== id));
  }, [presets, saveToStorage]);

  const loadPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    return preset ? preset.values : null;
  }, [presets]);

  return { presets, savePreset, deletePreset, loadPreset };
}