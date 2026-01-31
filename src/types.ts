export type SynthMode =
  | 'additive'
  | 'spectral'
  | 'scanline'
  | 'scanline-color'
  | 'rgb-additive'
  | 'hsv'
  | 'pulse';

export interface SynthParams {
  mode: SynthMode;
  angle: number;
  speed: number;
  volume: number;
  oscillatorCount: number;
  minFreq: number;
  maxFreq: number;
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

export const DEFAULT_PARAMS: SynthParams = {
  mode: 'scanline',
  angle: 0,
  speed: 1.0,
  volume: 70,
  oscillatorCount: 32,
  minFreq: 80,
  maxFreq: 4000,
};
