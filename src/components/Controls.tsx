import { SYNTH_MODES, DEFAULT_SYNTH_PARAMS, DEFAULT_PATTERN_PARAMS } from '../types';
import { Slider } from './Slider';
import { PresetBar } from './PresetBar';
import { ModulationPanel } from './ModulationPanel';
import type { SynthMode, SynthParams, PatternParams, InputSource, ModulationConfig, AppParams } from '../types';

interface ControlsProps {
  synthParams: SynthParams;
  patternParams: PatternParams;
  inputSource: InputSource;
  modulations: ModulationConfig[];
  isRunning: boolean;
  onSynthChange: (params: Partial<SynthParams>) => void;
  onPatternChange: (params: Partial<PatternParams>) => void;
  onInputSourceChange: (source: InputSource) => void;
  onModulationsChange: (modulations: ModulationConfig[]) => void;
  onLoadPreset: (params: AppParams) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onRandom: () => void;
  onSwitchCamera: () => void;
  cameraLabel: string;
  showHelp: boolean;
}

export function Controls({
  synthParams,
  patternParams,
  inputSource,
  modulations,
  isRunning,
  onSynthChange,
  onPatternChange,
  onInputSourceChange,
  onModulationsChange,
  onLoadPreset,
  onStart,
  onStop,
  onReset,
  onRandom,
  onSwitchCamera,
  cameraLabel,
  showHelp,
}: ControlsProps) {
  const isScanlineMode = synthParams.mode === 'scanline' || synthParams.mode === 'scanline-color';
  const isGenerator = inputSource === 'generator';

  const currentAppParams: AppParams = {
    inputSource,
    synth: synthParams,
    pattern: patternParams,
    modulations,
  };

  return (
    <div className="controls">
      <PresetBar currentParams={currentAppParams} onLoadPreset={onLoadPreset} />

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

        <Slider
          label="Volume"
          value={synthParams.volume}
          defaultValue={DEFAULT_SYNTH_PARAMS.volume}
          min={0}
          max={100}
          onChange={(v) => onSynthChange({ volume: v })}
          formatValue={(v) => `${v}%`}
        />

        {isScanlineMode && (
          <>
            <Slider
              label="Scan Angle"
              value={synthParams.angle}
              defaultValue={DEFAULT_SYNTH_PARAMS.angle}
              min={0}
              max={360}
              onChange={(v) => onSynthChange({ angle: v })}
              formatValue={(v) => `${v}deg`}
            />
            <Slider
              label="Scan Speed"
              value={synthParams.speed}
              defaultValue={DEFAULT_SYNTH_PARAMS.speed}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(v) => onSynthChange({ speed: v })}
              formatValue={(v) => `${v.toFixed(1)}x`}
            />
          </>
        )}

        <div className="control-group buttons">
          {!isRunning ? (
            <button onClick={onStart}>Start</button>
          ) : (
            <button onClick={onStop}>Stop</button>
          )}
          <button onClick={onReset}>Reset</button>
          {isGenerator && <button onClick={onRandom}>Random</button>}
          {!isGenerator && <button onClick={onSwitchCamera}>Camera</button>}
        </div>
      </div>

      {isGenerator && (
        <>
          <div className="controls-row">
            <Slider
              label="Columns"
              value={patternParams.columns}
              defaultValue={DEFAULT_PATTERN_PARAMS.columns}
              min={1}
              max={32}
              onChange={(v) => onPatternChange({ columns: v })}
            />
            <Slider
              label="Rows"
              value={patternParams.rows}
              defaultValue={DEFAULT_PATTERN_PARAMS.rows}
              min={1}
              max={32}
              onChange={(v) => onPatternChange({ rows: v })}
            />
            <Slider
              label="Cell Size"
              value={patternParams.cellSize}
              defaultValue={DEFAULT_PATTERN_PARAMS.cellSize}
              min={4}
              max={100}
              onChange={(v) => onPatternChange({ cellSize: v })}
            />
            <Slider
              label="Gap"
              value={patternParams.gap}
              defaultValue={DEFAULT_PATTERN_PARAMS.gap}
              min={0}
              max={50}
              onChange={(v) => onPatternChange({ gap: v })}
            />
            <Slider
              label="Fill"
              value={patternParams.fillRatio}
              defaultValue={DEFAULT_PATTERN_PARAMS.fillRatio}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => onPatternChange({ fillRatio: v })}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
            <Slider
              label="Round"
              value={patternParams.roundness}
              defaultValue={DEFAULT_PATTERN_PARAMS.roundness}
              min={0}
              max={100}
              onChange={(v) => onPatternChange({ roundness: v })}
              formatValue={(v) => `${v}%`}
            />
            <div className="control-group buttons">
              <button onClick={() => onPatternChange({ invert: !patternParams.invert })}>
                {patternParams.invert ? 'White BG' : 'Black BG'}
              </button>
            </div>
          </div>

          <div className="controls-row">
            <Slider
              label="Rotation"
              value={patternParams.rotation}
              defaultValue={DEFAULT_PATTERN_PARAMS.rotation}
              min={-180}
              max={180}
              onChange={(v) => onPatternChange({ rotation: v })}
              formatValue={(v) => `${v}deg`}
            />
            <Slider
              label="Skew X"
              value={patternParams.skewX}
              defaultValue={DEFAULT_PATTERN_PARAMS.skewX}
              min={-60}
              max={60}
              onChange={(v) => onPatternChange({ skewX: v })}
              formatValue={(v) => `${v}deg`}
            />
            <Slider
              label="Skew Y"
              value={patternParams.skewY}
              defaultValue={DEFAULT_PATTERN_PARAMS.skewY}
              min={-60}
              max={60}
              onChange={(v) => onPatternChange({ skewY: v })}
              formatValue={(v) => `${v}deg`}
            />
            <Slider
              label="Scale X"
              value={patternParams.scaleX}
              defaultValue={DEFAULT_PATTERN_PARAMS.scaleX}
              min={0.1}
              max={3}
              step={0.1}
              onChange={(v) => onPatternChange({ scaleX: v })}
              formatValue={(v) => v.toFixed(1)}
            />
            <Slider
              label="Scale Y"
              value={patternParams.scaleY}
              defaultValue={DEFAULT_PATTERN_PARAMS.scaleY}
              min={0.1}
              max={3}
              step={0.1}
              onChange={(v) => onPatternChange({ scaleY: v })}
              formatValue={(v) => v.toFixed(1)}
            />
          </div>

          <div className="controls-row">
            <Slider
              label="Offset X"
              value={patternParams.offsetX}
              defaultValue={DEFAULT_PATTERN_PARAMS.offsetX}
              min={-200}
              max={200}
              onChange={(v) => onPatternChange({ offsetX: v })}
            />
            <Slider
              label="Offset Y"
              value={patternParams.offsetY}
              defaultValue={DEFAULT_PATTERN_PARAMS.offsetY}
              min={-200}
              max={200}
              onChange={(v) => onPatternChange({ offsetY: v })}
            />
            <Slider
              label="Anim Rot"
              value={patternParams.animateRotation}
              defaultValue={DEFAULT_PATTERN_PARAMS.animateRotation}
              min={-100}
              max={100}
              onChange={(v) => onPatternChange({ animateRotation: v })}
            />
            <Slider
              label="Anim Skew X"
              value={patternParams.animateSkewX}
              defaultValue={DEFAULT_PATTERN_PARAMS.animateSkewX}
              min={-50}
              max={50}
              onChange={(v) => onPatternChange({ animateSkewX: v })}
            />
            <Slider
              label="Anim Skew Y"
              value={patternParams.animateSkewY}
              defaultValue={DEFAULT_PATTERN_PARAMS.animateSkewY}
              min={-50}
              max={50}
              onChange={(v) => onPatternChange({ animateSkewY: v })}
            />
          </div>

          <div className="controls-row">
            <Slider
              label="Anim Off X"
              value={patternParams.animateOffsetX}
              defaultValue={DEFAULT_PATTERN_PARAMS.animateOffsetX}
              min={0}
              max={10}
              step={0.1}
              onChange={(v) => onPatternChange({ animateOffsetX: v })}
              formatValue={(v) => v.toFixed(1)}
            />
            <Slider
              label="Anim Off Y"
              value={patternParams.animateOffsetY}
              defaultValue={DEFAULT_PATTERN_PARAMS.animateOffsetY}
              min={0}
              max={10}
              step={0.1}
              onChange={(v) => onPatternChange({ animateOffsetY: v })}
              formatValue={(v) => v.toFixed(1)}
            />
          </div>

          <ModulationPanel modulations={modulations} onModulationsChange={onModulationsChange} />
        </>
      )}

      <div className="controls-row info-row">
        {!isGenerator && <span className="info-item">{cameraLabel}</span>}
        <span className="info-item">{SYNTH_MODES.find((m) => m.id === synthParams.mode)?.description}</span>
      </div>

      {showHelp && (
        <div className="controls-row help-row">
          <span>Keys: 1-7 modes, A/D angle, W/S speed, +/- volume, G source, R reset, X random, H help</span>
        </div>
      )}
    </div>
  );
}
