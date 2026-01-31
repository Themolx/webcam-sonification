export type SynthMode =
  | 'additive'
  | 'spectral'
  | 'scanline'
  | 'scanline-color'
  | 'rgb-additive'
  | 'hsv'
  | 'pulse';

export type InputSource = 'camera' | 'generator';

export type ModulatableParam =
  | 'columns'
  | 'rows'
  | 'cellSize'
  | 'gap'
  | 'fillRatio'
  | 'roundness'
  | 'rotation'
  | 'skewX'
  | 'skewY'
  | 'scaleX'
  | 'scaleY'
  | 'offsetX'
  | 'offsetY';

export interface ModulationConfig {
  param: ModulatableParam;
  speed: number;
  amount: number;
  min: number;
  max: number;
}

export interface PatternParams {
  columns: number;
  rows: number;
  cellSize: number;
  gap: number;
  fillRatio: number;
  roundness: number;
  invert: boolean;

  rotation: number;
  skewX: number;
  skewY: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;

  animateRotation: number;
  animateSkewX: number;
  animateSkewY: number;
  animateOffsetX: number;
  animateOffsetY: number;
}

export interface SynthParams {
  mode: SynthMode;
  angle: number;
  speed: number;
  volume: number;
  oscillatorCount: number;
  minFreq: number;
  maxFreq: number;
}

export interface AppParams {
  inputSource: InputSource;
  synth: SynthParams;
  pattern: PatternParams;
  modulations: ModulationConfig[];
}

export interface Preset {
  name: string;
  params: AppParams;
}

export interface AudioState {
  isPlaying: boolean;
  waveformData: Float32Array | null;
}

export const SYNTH_MODES: { id: SynthMode; name: string; description: string }[] = [
  { id: 'additive', name: 'Additive', description: 'Horizontal bands control oscillator amplitudes' },
  { id: 'spectral', name: 'Spectral', description: 'Image as magnitude spectrum with inverse FFT' },
  { id: 'scanline', name: 'Scanline', description: 'Single line scans through image at angle' },
  { id: 'scanline-color', name: 'Scanline Color', description: 'RGB channels map to bass, mid, treble' },
  { id: 'rgb-additive', name: 'RGB Additive', description: 'Color channels control frequency groups' },
  { id: 'hsv', name: 'HSV', description: 'Hue controls pitch, saturation controls amplitude' },
  { id: 'pulse', name: 'Pulse', description: 'Edge detection triggers percussive sounds' },
];

export const PARAM_RANGES: Record<ModulatableParam, { min: number; max: number; step: number }> = {
  columns: { min: 1, max: 32, step: 1 },
  rows: { min: 1, max: 32, step: 1 },
  cellSize: { min: 4, max: 100, step: 1 },
  gap: { min: 0, max: 50, step: 1 },
  fillRatio: { min: 0.1, max: 1, step: 0.05 },
  roundness: { min: 0, max: 100, step: 1 },
  rotation: { min: -180, max: 180, step: 1 },
  skewX: { min: -60, max: 60, step: 1 },
  skewY: { min: -60, max: 60, step: 1 },
  scaleX: { min: 0.1, max: 3, step: 0.1 },
  scaleY: { min: 0.1, max: 3, step: 0.1 },
  offsetX: { min: -200, max: 200, step: 1 },
  offsetY: { min: -200, max: 200, step: 1 },
};

export const DEFAULT_SYNTH_PARAMS: SynthParams = {
  mode: 'scanline',
  angle: 0,
  speed: 1.0,
  volume: 70,
  oscillatorCount: 32,
  minFreq: 80,
  maxFreq: 4000,
};

export const DEFAULT_PATTERN_PARAMS: PatternParams = {
  columns: 8,
  rows: 8,
  cellSize: 40,
  gap: 4,
  fillRatio: 1.0,
  roundness: 0,
  invert: false,

  rotation: 0,
  skewX: 0,
  skewY: 0,
  scaleX: 1.0,
  scaleY: 1.0,
  offsetX: 0,
  offsetY: 0,

  animateRotation: 0,
  animateSkewX: 0,
  animateSkewY: 0,
  animateOffsetX: 0,
  animateOffsetY: 0,
};

export const DEFAULT_PARAMS: AppParams = {
  inputSource: 'generator',
  synth: DEFAULT_SYNTH_PARAMS,
  pattern: DEFAULT_PATTERN_PARAMS,
  modulations: [],
};

const STORAGE_KEY = 'webcam-sonification-settings';
const PRESETS_KEY = 'webcam-sonification-presets';

export function saveSettings(params: AppParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}

export function loadSettings(): AppParams | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppParams;
      if (!parsed.modulations) parsed.modulations = [];
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load settings', e);
  }
  return null;
}

export function savePreset(slot: number, name: string, params: AppParams): void {
  try {
    const presets = loadPresets();
    presets[slot] = { name, params };
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save preset', e);
  }
}

export function loadPresets(): (Preset | null)[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored) as (Preset | null)[];
    }
  } catch (e) {
    console.warn('Failed to load presets', e);
  }
  return [null, null, null, null, null, null, null, null];
}

export function loadPreset(slot: number): Preset | null {
  const presets = loadPresets();
  return presets[slot] || null;
}

function randomRange(min: number, max: number, step = 1): number {
  const steps = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

function maybeZero(value: number, zeroChance = 0.7): number {
  return Math.random() < zeroChance ? 0 : value;
}

export function randomizePattern(): PatternParams {
  return {
    columns: randomRange(2, 20),
    rows: randomRange(2, 20),
    cellSize: randomRange(10, 80),
    gap: randomRange(0, 30),
    fillRatio: randomRange(0.3, 1.0, 0.1),
    roundness: randomRange(0, 100),
    invert: Math.random() > 0.5,
    rotation: randomRange(-180, 180),
    skewX: randomRange(-45, 45),
    skewY: randomRange(-45, 45),
    scaleX: randomRange(0.5, 2.0, 0.1),
    scaleY: randomRange(0.5, 2.0, 0.1),
    offsetX: randomRange(-100, 100),
    offsetY: randomRange(-100, 100),
    animateRotation: maybeZero(randomRange(-50, 50)),
    animateSkewX: maybeZero(randomRange(-20, 20)),
    animateSkewY: maybeZero(randomRange(-20, 20)),
    animateOffsetX: maybeZero(randomRange(0, 5, 0.5)),
    animateOffsetY: maybeZero(randomRange(0, 5, 0.5)),
  };
}

export function interpolateParams(a: AppParams, b: AppParams, t: number): AppParams {
  const lerp = (v1: number, v2: number) => v1 + (v2 - v1) * t;

  return {
    inputSource: t < 0.5 ? a.inputSource : b.inputSource,
    synth: {
      mode: t < 0.5 ? a.synth.mode : b.synth.mode,
      angle: lerp(a.synth.angle, b.synth.angle),
      speed: lerp(a.synth.speed, b.synth.speed),
      volume: lerp(a.synth.volume, b.synth.volume),
      oscillatorCount: Math.round(lerp(a.synth.oscillatorCount, b.synth.oscillatorCount)),
      minFreq: lerp(a.synth.minFreq, b.synth.minFreq),
      maxFreq: lerp(a.synth.maxFreq, b.synth.maxFreq),
    },
    pattern: {
      columns: Math.round(lerp(a.pattern.columns, b.pattern.columns)),
      rows: Math.round(lerp(a.pattern.rows, b.pattern.rows)),
      cellSize: Math.round(lerp(a.pattern.cellSize, b.pattern.cellSize)),
      gap: Math.round(lerp(a.pattern.gap, b.pattern.gap)),
      fillRatio: lerp(a.pattern.fillRatio, b.pattern.fillRatio),
      roundness: Math.round(lerp(a.pattern.roundness, b.pattern.roundness)),
      invert: t < 0.5 ? a.pattern.invert : b.pattern.invert,
      rotation: lerp(a.pattern.rotation, b.pattern.rotation),
      skewX: lerp(a.pattern.skewX, b.pattern.skewX),
      skewY: lerp(a.pattern.skewY, b.pattern.skewY),
      scaleX: lerp(a.pattern.scaleX, b.pattern.scaleX),
      scaleY: lerp(a.pattern.scaleY, b.pattern.scaleY),
      offsetX: lerp(a.pattern.offsetX, b.pattern.offsetX),
      offsetY: lerp(a.pattern.offsetY, b.pattern.offsetY),
      animateRotation: lerp(a.pattern.animateRotation, b.pattern.animateRotation),
      animateSkewX: lerp(a.pattern.animateSkewX, b.pattern.animateSkewX),
      animateSkewY: lerp(a.pattern.animateSkewY, b.pattern.animateSkewY),
      animateOffsetX: lerp(a.pattern.animateOffsetX, b.pattern.animateOffsetX),
      animateOffsetY: lerp(a.pattern.animateOffsetY, b.pattern.animateOffsetY),
    },
    modulations: t < 0.5 ? a.modulations : b.modulations,
  };
}

export function applyModulations(
  baseParams: PatternParams,
  modulations: ModulationConfig[],
  time: number
): PatternParams {
  const result = { ...baseParams };

  for (const mod of modulations) {
    if (mod.amount === 0 || mod.speed === 0) continue;

    const wave = Math.sin(time * mod.speed);
    const delta = wave * mod.amount;
    const current = result[mod.param] as number;
    const newValue = Math.max(mod.min, Math.min(mod.max, current + delta));

    (result as Record<string, number | boolean>)[mod.param] = newValue;
  }

  return result;
}
