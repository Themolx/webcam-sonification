export type SynthMode =
  | 'additive'
  | 'spectral'
  | 'scanline'
  | 'scanline-color'
  | 'rgb-additive'
  | 'hsv'
  | 'pulse';

export type InputSource = 'camera' | 'generator';

export interface PatternParams {
  // Grid
  columns: number;
  rows: number;
  cellSize: number;
  gap: number;
  fillRatio: number;
  roundness: number;
  invert: boolean;

  // Transform
  rotation: number;
  skewX: number;
  skewY: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;

  // Animation
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
};

const STORAGE_KEY = 'webcam-sonification-settings';

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
      return JSON.parse(stored) as AppParams;
    }
  } catch (e) {
    console.warn('Failed to load settings', e);
  }
  return null;
}

function randomRange(min: number, max: number, step = 1): number {
  const steps = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

export function randomizePattern(): PatternParams {
  return {
    columns: randomRange(2, 20),
    rows: randomRange(2, 20),
    cellSize: randomRange(10, 80),
    gap: randomRange(0, 30),
    fillRatio: randomRange(0.3, 1.0, 0.1),
    roundness: randomRange(0, 50),
    invert: Math.random() > 0.5,
    rotation: randomRange(-180, 180),
    skewX: randomRange(-45, 45),
    skewY: randomRange(-45, 45),
    scaleX: randomRange(0.5, 2.0, 0.1),
    scaleY: randomRange(0.5, 2.0, 0.1),
    offsetX: randomRange(-100, 100),
    offsetY: randomRange(-100, 100),
    animateRotation: randomRange(-50, 50),
    animateSkewX: randomRange(-20, 20),
    animateSkewY: randomRange(-20, 20),
    animateOffsetX: randomRange(0, 5, 0.5),
    animateOffsetY: randomRange(0, 5, 0.5),
  };
}
