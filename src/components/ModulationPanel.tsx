import { PARAM_RANGES } from '../types';
import type { ModulationConfig, ModulatableParam } from '../types';

interface ModulationPanelProps {
  modulations: ModulationConfig[];
  onModulationsChange: (modulations: ModulationConfig[]) => void;
}

const PARAM_LABELS: Record<ModulatableParam, string> = {
  columns: 'Columns',
  rows: 'Rows',
  cellSize: 'Cell Size',
  gap: 'Gap',
  fillRatio: 'Fill',
  roundness: 'Roundness',
  rotation: 'Rotation',
  skewX: 'Skew X',
  skewY: 'Skew Y',
  scaleX: 'Scale X',
  scaleY: 'Scale Y',
  offsetX: 'Offset X',
  offsetY: 'Offset Y',
};

export function ModulationPanel({ modulations, onModulationsChange }: ModulationPanelProps) {
  const addModulation = () => {
    const param: ModulatableParam = 'rotation';
    const range = PARAM_RANGES[param];
    const newMod: ModulationConfig = {
      param,
      speed: 1,
      amount: 20,
      min: range.min,
      max: range.max,
    };
    onModulationsChange([...modulations, newMod]);
  };

  const removeModulation = (index: number) => {
    onModulationsChange(modulations.filter((_, i) => i !== index));
  };

  const updateModulation = (index: number, updates: Partial<ModulationConfig>) => {
    const updated = modulations.map((mod, i) => {
      if (i !== index) return mod;
      const newMod = { ...mod, ...updates };
      if (updates.param) {
        const range = PARAM_RANGES[updates.param];
        newMod.min = range.min;
        newMod.max = range.max;
      }
      return newMod;
    });
    onModulationsChange(updated);
  };

  return (
    <div className="modulation-panel">
      <div className="modulation-header">
        <span>Auto Modulation (LFO)</span>
        <button onClick={addModulation} className="add-mod-btn">
          Add
        </button>
      </div>
      {modulations.map((mod, i) => (
        <div key={i} className="modulation-row">
          <select
            value={mod.param}
            onChange={(e) => updateModulation(i, { param: e.target.value as ModulatableParam })}
          >
            {Object.entries(PARAM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <div className="mod-control">
            <label>Spd: {mod.speed.toFixed(1)}</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={mod.speed}
              onChange={(e) => updateModulation(i, { speed: Number(e.target.value) })}
            />
          </div>
          <div className="mod-control">
            <label>Amt: {mod.amount.toFixed(0)}</label>
            <input
              type="range"
              min="0"
              max={(mod.max - mod.min) / 2}
              step="1"
              value={mod.amount}
              onChange={(e) => updateModulation(i, { amount: Number(e.target.value) })}
            />
          </div>
          <button onClick={() => removeModulation(i)} className="remove-mod-btn">
            X
          </button>
        </div>
      ))}
    </div>
  );
}
