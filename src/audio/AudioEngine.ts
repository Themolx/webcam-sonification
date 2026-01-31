import type { SynthParams } from '../types';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private oscillatorGains: GainNode[] = [];
  private frequencies: number[] = [];
  private phases: number[] = [];
  private amplitudes: number[] = [];
  private scanPosition: number = 0;
  private lastFrameTime: number = 0;
  private isPlaying: boolean = false;
  private waveformBuffer: Float32Array = new Float32Array(2048);
  private scriptProcessor: ScriptProcessorNode | null = null;
  private customWaveformData: Float32Array = new Float32Array(2048);
  private prevEdgeMagnitudes: number[] = [];

  constructor() {
    this.frequencies = [];
    this.phases = [];
    this.amplitudes = [];
  }

  async initialize(params: SynthParams): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({ sampleRate: 44100 });
    await this.audioContext.resume();

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = params.volume / 100;
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.initializeFrequencies(params);
    this.createOscillators(params);

    this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.scriptProcessor.onaudioprocess = () => {
      if (this.analyser) {
        this.analyser.getFloatTimeDomainData(this.waveformBuffer as Float32Array<ArrayBuffer>);
        for (let i = 0; i < this.waveformBuffer.length; i++) {
          this.customWaveformData[i] = this.waveformBuffer[i];
        }
      }
    };
    this.scriptProcessor.connect(this.audioContext.destination);

    this.isPlaying = true;
  }

  private initializeFrequencies(params: SynthParams): void {
    this.frequencies = [];
    this.phases = [];
    this.amplitudes = [];
    this.prevEdgeMagnitudes = [];

    const logMin = Math.log(params.minFreq);
    const logMax = Math.log(params.maxFreq);

    for (let i = 0; i < params.oscillatorCount; i++) {
      const t = i / (params.oscillatorCount - 1);
      const freq = Math.exp(logMin + t * (logMax - logMin));
      this.frequencies.push(freq);
      this.phases.push(0);
      this.amplitudes.push(0);
      this.prevEdgeMagnitudes.push(0);
    }
  }

  private createOscillators(params: SynthParams): void {
    if (!this.audioContext || !this.gainNode) return;

    this.oscillators.forEach((osc) => {
      try { osc.stop(); } catch {}
      osc.disconnect();
    });
    this.oscillatorGains.forEach((g) => g.disconnect());
    this.oscillators = [];
    this.oscillatorGains = [];

    for (let i = 0; i < params.oscillatorCount; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = this.frequencies[i];
      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start();

      this.oscillators.push(osc);
      this.oscillatorGains.push(gain);
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = volume / 100;
    }
  }

  getWaveformData(): Float32Array {
    return this.customWaveformData;
  }

  synthesizeAdditive(imageData: ImageData, params: SynthParams): void {
    if (!this.isPlaying) return;

    const { width, height, data } = imageData;
    const bandHeight = height / params.oscillatorCount;
    const smoothing = 0.8;

    for (let i = 0; i < params.oscillatorCount; i++) {
      const bandIndex = params.oscillatorCount - 1 - i;
      const startY = Math.floor(bandIndex * bandHeight);
      const endY = Math.floor((bandIndex + 1) * bandHeight);

      let sum = 0;
      let count = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          sum += gray;
          count++;
        }
      }

      const targetAmp = (sum / count / 255) * 0.7;
      this.amplitudes[i] = this.amplitudes[i] * smoothing + targetAmp * (1 - smoothing);

      if (this.oscillatorGains[i]) {
        this.oscillatorGains[i].gain.value = this.amplitudes[i];
      }
    }
  }

  synthesizeSpectral(imageData: ImageData, params: SynthParams): void {
    if (!this.isPlaying) return;

    const { width, height, data } = imageData;
    const smoothing = 0.8;

    for (let i = 0; i < params.oscillatorCount; i++) {
      const y = Math.floor((i / params.oscillatorCount) * height);
      let sum = 0;

      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        sum += gray;
      }

      const targetAmp = (sum / width / 255) * 0.7;
      this.amplitudes[i] = this.amplitudes[i] * smoothing + targetAmp * (1 - smoothing);

      if (this.oscillatorGains[i]) {
        this.oscillatorGains[i].gain.value = this.amplitudes[i];
      }
    }
  }

  synthesizeScanline(imageData: ImageData, params: SynthParams): { x1: number; y1: number; x2: number; y2: number } {
    if (!this.isPlaying) return { x1: 0, y1: 0, x2: 0, y2: 0 };

    const { width, height, data } = imageData;
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.scanPosition += dt * params.speed * 0.5;
    if (this.scanPosition > 1) this.scanPosition -= 1;

    const angleRad = (params.angle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const centerX = width / 2;
    const centerY = height / 2;
    const diagonal = Math.sqrt(width * width + height * height);

    const offset = (this.scanPosition - 0.5) * diagonal;
    const perpX = -sin;
    const perpY = cos;

    const lineStartX = centerX + offset * perpX - diagonal * cos;
    const lineStartY = centerY + offset * perpY - diagonal * sin;
    const lineEndX = centerX + offset * perpX + diagonal * cos;
    const lineEndY = centerY + offset * perpY + diagonal * sin;

    const samples: number[] = [];
    const sampleCount = 256;

    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1);
      const x = Math.floor(lineStartX + t * (lineEndX - lineStartX));
      const y = Math.floor(lineStartY + t * (lineEndY - lineStartY));

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        samples.push(gray / 255);
      } else {
        samples.push(0);
      }
    }

    const smoothing = 0.7;
    for (let i = 0; i < params.oscillatorCount; i++) {
      const sampleIdx = Math.floor((i / params.oscillatorCount) * sampleCount);
      const targetAmp = samples[sampleIdx] * 0.5;
      this.amplitudes[i] = this.amplitudes[i] * smoothing + targetAmp * (1 - smoothing);

      if (this.oscillatorGains[i]) {
        this.oscillatorGains[i].gain.value = this.amplitudes[i];
      }
    }

    return {
      x1: lineStartX,
      y1: lineStartY,
      x2: lineEndX,
      y2: lineEndY,
    };
  }

  synthesizeScanlineColor(imageData: ImageData, params: SynthParams): { x1: number; y1: number; x2: number; y2: number } {
    if (!this.isPlaying) return { x1: 0, y1: 0, x2: 0, y2: 0 };

    const { width, height, data } = imageData;
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.scanPosition += dt * params.speed * 0.5;
    if (this.scanPosition > 1) this.scanPosition -= 1;

    const angleRad = (params.angle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const centerX = width / 2;
    const centerY = height / 2;
    const diagonal = Math.sqrt(width * width + height * height);

    const offset = (this.scanPosition - 0.5) * diagonal;
    const perpX = -sin;
    const perpY = cos;

    const lineStartX = centerX + offset * perpX - diagonal * cos;
    const lineStartY = centerY + offset * perpY - diagonal * sin;
    const lineEndX = centerX + offset * perpX + diagonal * cos;
    const lineEndY = centerY + offset * perpY + diagonal * sin;

    let rSum = 0, gSum = 0, bSum = 0;
    let count = 0;
    const sampleCount = 256;

    for (let i = 0; i < sampleCount; i++) {
      const t = i / (sampleCount - 1);
      const x = Math.floor(lineStartX + t * (lineEndX - lineStartX));
      const y = Math.floor(lineStartY + t * (lineEndY - lineStartY));

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        count++;
      }
    }

    if (count > 0) {
      const rAmp = (rSum / count / 255) * 0.4;
      const gAmp = (gSum / count / 255) * 0.4;
      const bAmp = (bSum / count / 255) * 0.4;

      const smoothing = 0.8;
      const third = Math.floor(params.oscillatorCount / 3);

      for (let i = 0; i < params.oscillatorCount; i++) {
        let targetAmp = 0;
        if (i < third) {
          targetAmp = rAmp;
        } else if (i < third * 2) {
          targetAmp = gAmp;
        } else {
          targetAmp = bAmp;
        }

        this.amplitudes[i] = this.amplitudes[i] * smoothing + targetAmp * (1 - smoothing);

        if (this.oscillatorGains[i]) {
          this.oscillatorGains[i].gain.value = this.amplitudes[i];
        }
      }
    }

    return {
      x1: lineStartX,
      y1: lineStartY,
      x2: lineEndX,
      y2: lineEndY,
    };
  }

  synthesizeRGBAdditive(imageData: ImageData, params: SynthParams): void {
    if (!this.isPlaying) return;

    const { width, height, data } = imageData;
    const bandHeight = height / params.oscillatorCount;
    const smoothing = 0.8;
    const third = Math.floor(params.oscillatorCount / 3);

    for (let i = 0; i < params.oscillatorCount; i++) {
      const bandIndex = params.oscillatorCount - 1 - i;
      const startY = Math.floor(bandIndex * bandHeight);
      const endY = Math.floor((bandIndex + 1) * bandHeight);

      let sum = 0;
      let count = 0;
      const colorChannel = i < third ? 0 : i < third * 2 ? 1 : 2;

      for (let y = startY; y < endY; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          sum += data[idx + colorChannel];
          count++;
        }
      }

      const targetAmp = (sum / count / 255) * 0.7;
      this.amplitudes[i] = this.amplitudes[i] * smoothing + targetAmp * (1 - smoothing);

      if (this.oscillatorGains[i]) {
        this.oscillatorGains[i].gain.value = this.amplitudes[i];
      }
    }
  }

  synthesizeHSV(imageData: ImageData, params: SynthParams): void {
    if (!this.isPlaying) return;

    const { width, height, data } = imageData;
    const bandHeight = height / params.oscillatorCount;
    const smoothing = 0.8;

    for (let i = 0; i < params.oscillatorCount; i++) {
      const bandIndex = params.oscillatorCount - 1 - i;
      const startY = Math.floor(bandIndex * bandHeight);
      const endY = Math.floor((bandIndex + 1) * bandHeight);

      let hueSum = 0;
      let satSum = 0;
      let valSum = 0;
      let count = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const d = max - min;

          let h = 0;
          if (d !== 0) {
            if (max === r) h = ((g - b) / d + 6) % 6;
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
          }

          const s = max === 0 ? 0 : d / max;
          const v = max;

          hueSum += h;
          satSum += s;
          valSum += v;
          count++;
        }
      }

      const avgHue = hueSum / count;
      const avgSat = satSum / count;
      const avgVal = valSum / count;

      const freqMod = 0.8 + avgHue * 0.4;
      const targetAmp = avgSat * avgVal * 0.7;

      this.amplitudes[i] = this.amplitudes[i] * smoothing + targetAmp * (1 - smoothing);

      if (this.oscillators[i]) {
        this.oscillators[i].frequency.value = this.frequencies[i] * freqMod;
      }
      if (this.oscillatorGains[i]) {
        this.oscillatorGains[i].gain.value = this.amplitudes[i];
      }
    }
  }

  synthesizePulse(imageData: ImageData, params: SynthParams): void {
    if (!this.isPlaying) return;

    const { width, height, data } = imageData;
    const bandHeight = height / params.oscillatorCount;

    for (let i = 0; i < params.oscillatorCount; i++) {
      const bandIndex = params.oscillatorCount - 1 - i;
      const startY = Math.floor(bandIndex * bandHeight);
      const endY = Math.floor((bandIndex + 1) * bandHeight);

      let edgeSum = 0;
      let count = 0;

      for (let y = startY + 1; y < endY - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const leftIdx = (y * width + (x - 1)) * 4;
          const rightIdx = (y * width + (x + 1)) * 4;
          const topIdx = ((y - 1) * width + x) * 4;
          const bottomIdx = ((y + 1) * width + x) * 4;

          const leftGray = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
          const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
          const topGray = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
          const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;

          const gx = rightGray - leftGray;
          const gy = bottomGray - topGray;
          const magnitude = Math.sqrt(gx * gx + gy * gy);

          edgeSum += magnitude;
          count++;
        }
      }

      const edgeMag = count > 0 ? edgeSum / count / 255 : 0;
      const prevMag = this.prevEdgeMagnitudes[i] || 0;
      const delta = Math.max(0, edgeMag - prevMag);
      this.prevEdgeMagnitudes[i] = edgeMag;

      if (delta > 0.02) {
        this.amplitudes[i] = Math.min(0.7, delta * 5);
      } else {
        this.amplitudes[i] *= 0.85;
      }

      if (this.oscillatorGains[i]) {
        this.oscillatorGains[i].gain.value = this.amplitudes[i];
      }
    }
  }

  reset(_params: SynthParams): void {
    this.scanPosition = 0;
    this.lastFrameTime = performance.now();
    this.phases = this.phases.map(() => 0);
    this.amplitudes = this.amplitudes.map(() => 0);
    this.prevEdgeMagnitudes = this.prevEdgeMagnitudes.map(() => 0);

    this.oscillatorGains.forEach((g) => {
      g.gain.value = 0;
    });

    this.oscillators.forEach((osc, i) => {
      osc.frequency.value = this.frequencies[i];
    });
  }

  stop(): void {
    this.isPlaying = false;

    this.oscillators.forEach((osc) => {
      try { osc.stop(); } catch {}
      osc.disconnect();
    });
    this.oscillatorGains.forEach((g) => g.disconnect());

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.oscillators = [];
    this.oscillatorGains = [];
    this.analyser = null;
    this.gainNode = null;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
