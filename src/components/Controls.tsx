import { SYNTH_MODES } from '../types';
import type { SynthMode, SynthParams } from '../types';

interface ControlsProps {
  params: SynthParams;
  isRunning: boolean;
  onParamsChange: (params: Partial<SynthParams>) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSwitchCamera: () => void;
  cameraLabel: string;
  showHelp: boolean;
}

export function Controls({
  params,
  isRunning,
  onParamsChange,
  onStart,
  onStop,
  onReset,
  onSwitchCamera,
  cameraLabel,
  showHelp,
}: ControlsProps) {
  const isScanlineMode = params.mode === 'scanline' || params.mode === 'scanline-color';

  return (
    <div className="controls">
      <div className="controls-row">
        <div className="control-group">
          <label>Mode</label>
          <select
            value={params.mode}
            onChange={(e) => onParamsChange({ mode: e.target.value as SynthMode })}
          >
            {SYNTH_MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Volume: {params.volume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={params.volume}
            onChange={(e) => onParamsChange({ volume: Number(e.target.value) })}
          />
        </div>

        {isScanlineMode && (
          <>
            <div className="control-group">
              <label>Angle: {params.angle}deg</label>
              <input
                type="range"
                min="0"
                max="360"
                value={params.angle}
                onChange={(e) => onParamsChange({ angle: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Speed: {params.speed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={params.speed}
                onChange={(e) => onParamsChange({ speed: Number(e.target.value) })}
              />
            </div>
          </>
        )}

        <div className="control-group buttons">
          {!isRunning ? (
            <button onClick={onStart}>Start</button>
          ) : (
            <button onClick={onStop}>Stop</button>
          )}
          <button onClick={onReset}>Reset</button>
          <button onClick={onSwitchCamera}>Camera</button>
        </div>
      </div>

      <div className="controls-row info-row">
        <span className="info-item">{cameraLabel}</span>
        <span className="info-item">{SYNTH_MODES.find((m) => m.id === params.mode)?.description}</span>
      </div>

      {showHelp && (
        <div className="controls-row help-row">
          <span>Keys: 1-7 modes, A/D angle, W/S speed, +/- volume, C camera, R reset, H help, Q quit</span>
        </div>
      )}
    </div>
  );
}
