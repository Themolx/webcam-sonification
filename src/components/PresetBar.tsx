import { useState, useEffect } from 'react';
import { loadPresets, savePreset, interpolateParams } from '../types';
import type { AppParams, Preset } from '../types';

interface PresetBarProps {
  currentParams: AppParams;
  onLoadPreset: (params: AppParams) => void;
}

export function PresetBar({ currentParams, onLoadPreset }: PresetBarProps) {
  const [presets, setPresets] = useState<(Preset | null)[]>([]);
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);
  const [interpolation, setInterpolation] = useState(0);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const handleSaveToSlot = (slot: number) => {
    const name = `Preset ${slot + 1}`;
    savePreset(slot, name, currentParams);
    setPresets(loadPresets());
  };

  const handleLoadSlot = (slot: number) => {
    const preset = presets[slot];
    if (preset) {
      onLoadPreset(preset.params);
    }
  };

  const handleSlotClick = (slot: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      handleSaveToSlot(slot);
    } else if (e.altKey) {
      if (selectedA === null) {
        setSelectedA(slot);
      } else if (selectedB === null && slot !== selectedA) {
        setSelectedB(slot);
      } else {
        setSelectedA(slot);
        setSelectedB(null);
      }
    } else {
      handleLoadSlot(slot);
    }
  };

  useEffect(() => {
    if (selectedA !== null && selectedB !== null) {
      const presetA = presets[selectedA];
      const presetB = presets[selectedB];
      if (presetA && presetB) {
        const interpolated = interpolateParams(presetA.params, presetB.params, interpolation);
        onLoadPreset(interpolated);
      }
    }
  }, [interpolation, selectedA, selectedB, presets, onLoadPreset]);

  return (
    <div className="preset-bar">
      <div className="preset-slots">
        {presets.map((preset, i) => (
          <button
            key={i}
            className={`preset-slot ${preset ? 'filled' : ''} ${selectedA === i ? 'selected-a' : ''} ${selectedB === i ? 'selected-b' : ''}`}
            onClick={(e) => handleSlotClick(i, e)}
            title={preset ? `${preset.name} (Shift+click to overwrite, Alt+click to select for blend)` : 'Empty (Shift+click to save)'}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {selectedA !== null && selectedB !== null && (
        <div className="interpolation-control">
          <label>Blend: {Math.round(interpolation * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={interpolation}
            onChange={(e) => setInterpolation(Number(e.target.value))}
          />
          <button
            className="clear-blend"
            onClick={() => {
              setSelectedA(null);
              setSelectedB(null);
              setInterpolation(0);
            }}
          >
            Clear
          </button>
        </div>
      )}
      <div className="preset-help">
        Click=load, Shift+click=save, Alt+click=blend
      </div>
    </div>
  );
}
