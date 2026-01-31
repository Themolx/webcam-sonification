import { SYNTH_MODES } from '../types';
import type { SynthMode, SynthParams, PatternParams, InputSource } from '../types';

interface ControlsProps {
  synthParams: SynthParams;
  patternParams: PatternParams;
  inputSource: InputSource;
  isRunning: boolean;
  onSynthChange: (params: Partial<SynthParams>) => void;
  onPatternChange: (params: Partial<PatternParams>) => void;
  onInputSourceChange: (source: InputSource) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSave: () => void;
  onRandom: () => void;
  onSwitchCamera: () => void;
  cameraLabel: string;
  showHelp: boolean;
}

export function Controls({
  synthParams,
  patternParams,
  inputSource,
  isRunning,
  onSynthChange,
  onPatternChange,
  onInputSourceChange,
  onStart,
  onStop,
  onReset,
  onSave,
  onRandom,
  onSwitchCamera,
  cameraLabel,
  showHelp,
}: ControlsProps) {
  const isScanlineMode = synthParams.mode === 'scanline' || synthParams.mode === 'scanline-color';
  const isGenerator = inputSource === 'generator';

  return (
    <div className="controls">
      <div className="controls-row">
        <div className="control-group">
          <label>Source</label>
          <select
            value={inputSource}
            onChange={(e) => onInputSourceChange(e.target.value as InputSource)}
          >
            <option value="generator">Generator</option>
            <option value="camera">Camera</option>
          </select>
        </div>

        <div className="control-group">
          <label>Mode</label>
          <select
            value={synthParams.mode}
            onChange={(e) => onSynthChange({ mode: e.target.value as SynthMode })}
          >
            {SYNTH_MODES.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Volume: {synthParams.volume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={synthParams.volume}
            onChange={(e) => onSynthChange({ volume: Number(e.target.value) })}
          />
        </div>

        {isScanlineMode && (
          <>
            <div className="control-group">
              <label>Scan Angle: {synthParams.angle}deg</label>
              <input
                type="range"
                min="0"
                max="360"
                value={synthParams.angle}
                onChange={(e) => onSynthChange({ angle: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Scan Speed: {synthParams.speed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={synthParams.speed}
                onChange={(e) => onSynthChange({ speed: Number(e.target.value) })}
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
          <button onClick={onSave}>Save</button>
          {isGenerator && <button onClick={onRandom}>Random</button>}
          {!isGenerator && <button onClick={onSwitchCamera}>Camera</button>}
        </div>
      </div>

      {isGenerator && (
        <>
          <div className="controls-row">
            <div className="control-group">
              <label>Columns: {patternParams.columns}</label>
              <input
                type="range"
                min="1"
                max="32"
                value={patternParams.columns}
                onChange={(e) => onPatternChange({ columns: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Rows: {patternParams.rows}</label>
              <input
                type="range"
                min="1"
                max="32"
                value={patternParams.rows}
                onChange={(e) => onPatternChange({ rows: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Cell Size: {patternParams.cellSize}</label>
              <input
                type="range"
                min="4"
                max="100"
                value={patternParams.cellSize}
                onChange={(e) => onPatternChange({ cellSize: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Gap: {patternParams.gap}</label>
              <input
                type="range"
                min="0"
                max="50"
                value={patternParams.gap}
                onChange={(e) => onPatternChange({ gap: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Fill: {Math.round(patternParams.fillRatio * 100)}%</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={patternParams.fillRatio}
                onChange={(e) => onPatternChange({ fillRatio: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Round: {patternParams.roundness}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={patternParams.roundness}
                onChange={(e) => onPatternChange({ roundness: Number(e.target.value) })}
              />
            </div>

            <div className="control-group buttons">
              <button onClick={() => onPatternChange({ invert: !patternParams.invert })}>
                {patternParams.invert ? 'White BG' : 'Black BG'}
              </button>
            </div>
          </div>

          <div className="controls-row">
            <div className="control-group">
              <label>Rotation: {patternParams.rotation}deg</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={patternParams.rotation}
                onChange={(e) => onPatternChange({ rotation: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Skew X: {patternParams.skewX}deg</label>
              <input
                type="range"
                min="-60"
                max="60"
                value={patternParams.skewX}
                onChange={(e) => onPatternChange({ skewX: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Skew Y: {patternParams.skewY}deg</label>
              <input
                type="range"
                min="-60"
                max="60"
                value={patternParams.skewY}
                onChange={(e) => onPatternChange({ skewY: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Scale X: {patternParams.scaleX.toFixed(1)}</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={patternParams.scaleX}
                onChange={(e) => onPatternChange({ scaleX: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Scale Y: {patternParams.scaleY.toFixed(1)}</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={patternParams.scaleY}
                onChange={(e) => onPatternChange({ scaleY: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="controls-row">
            <div className="control-group">
              <label>Offset X: {patternParams.offsetX}</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={patternParams.offsetX}
                onChange={(e) => onPatternChange({ offsetX: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Offset Y: {patternParams.offsetY}</label>
              <input
                type="range"
                min="-200"
                max="200"
                value={patternParams.offsetY}
                onChange={(e) => onPatternChange({ offsetY: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Anim Rot: {patternParams.animateRotation}</label>
              <input
                type="range"
                min="-100"
                max="100"
                value={patternParams.animateRotation}
                onChange={(e) => onPatternChange({ animateRotation: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Anim Skew X: {patternParams.animateSkewX}</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={patternParams.animateSkewX}
                onChange={(e) => onPatternChange({ animateSkewX: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Anim Skew Y: {patternParams.animateSkewY}</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={patternParams.animateSkewY}
                onChange={(e) => onPatternChange({ animateSkewY: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="controls-row">
            <div className="control-group">
              <label>Anim Offset X: {patternParams.animateOffsetX.toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={patternParams.animateOffsetX}
                onChange={(e) => onPatternChange({ animateOffsetX: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label>Anim Offset Y: {patternParams.animateOffsetY.toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={patternParams.animateOffsetY}
                onChange={(e) => onPatternChange({ animateOffsetY: Number(e.target.value) })}
              />
            </div>
          </div>
        </>
      )}

      <div className="controls-row info-row">
        {!isGenerator && <span className="info-item">{cameraLabel}</span>}
        <span className="info-item">{SYNTH_MODES.find((m) => m.id === synthParams.mode)?.description}</span>
      </div>

      {showHelp && (
        <div className="controls-row help-row">
          <span>Keys: 1-7 modes, A/D angle, W/S speed, +/- volume, G source, R reset, S save, X random, H help</span>
        </div>
      )}
    </div>
  );
}
