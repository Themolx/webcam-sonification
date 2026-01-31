import { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from './hooks/useCamera';
import { AudioEngine } from './audio/AudioEngine';
import { Controls } from './components/Controls';
import { Waveform } from './components/Waveform';
import { VideoCanvas, type VideoCanvasHandle } from './components/VideoCanvas';
import { DEFAULT_PARAMS, SYNTH_MODES } from './types';
import type { SynthParams, SynthMode } from './types';
import './App.css';

function App() {
  const [params, setParams] = useState<SynthParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [scanlineCoords, setScanlineCoords] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState(640);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const videoCanvasRef = useRef<VideoCanvasHandle>(null);
  const animationFrameRef = useRef<number>(0);

  const {
    videoRef,
    devices,
    currentDeviceId,
    isActive: cameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const currentCameraLabel =
    devices.find((d) => d.deviceId === currentDeviceId)?.label || 'No camera';

  const handleParamsChange = useCallback((newParams: Partial<SynthParams>) => {
    setParams((prev) => {
      const updated = { ...prev, ...newParams };
      if (audioEngineRef.current && newParams.volume !== undefined) {
        audioEngineRef.current.setVolume(updated.volume);
      }
      return updated;
    });
  }, []);

  const processFrame = useCallback(() => {
    if (!isRunning || !audioEngineRef.current || !videoCanvasRef.current) {
      return;
    }

    const imageData = videoCanvasRef.current.getImageData();
    if (!imageData) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const engine = audioEngineRef.current;
    let coords = null;

    switch (params.mode) {
      case 'additive':
        engine.synthesizeAdditive(imageData, params);
        break;
      case 'spectral':
        engine.synthesizeSpectral(imageData, params);
        break;
      case 'scanline':
        coords = engine.synthesizeScanline(imageData, params);
        break;
      case 'scanline-color':
        coords = engine.synthesizeScanlineColor(imageData, params);
        break;
      case 'rgb-additive':
        engine.synthesizeRGBAdditive(imageData, params);
        break;
      case 'hsv':
        engine.synthesizeHSV(imageData, params);
        break;
      case 'pulse':
        engine.synthesizePulse(imageData, params);
        break;
    }

    if (coords) {
      setScanlineCoords(coords);
    } else {
      setScanlineCoords(null);
    }

    const waveform = engine.getWaveformData();
    setWaveformData(new Float32Array(waveform));

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isRunning, params]);

  const handleStart = useCallback(async () => {
    await startCamera();

    const engine = new AudioEngine();
    await engine.initialize(params);
    audioEngineRef.current = engine;

    setIsRunning(true);
  }, [startCamera, params]);

  const handleStop = useCallback(() => {
    setIsRunning(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
      audioEngineRef.current = null;
    }

    stopCamera();
    setScanlineCoords(null);
    setWaveformData(null);
  }, [stopCamera]);

  const handleReset = useCallback(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.reset(params);
    }
    setScanlineCoords(null);
  }, [params]);

  useEffect(() => {
    if (isRunning && cameraActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, cameraActive, processFrame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7': {
          const modeIndex = parseInt(e.key) - 1;
          if (modeIndex < SYNTH_MODES.length) {
            handleParamsChange({ mode: SYNTH_MODES[modeIndex].id as SynthMode });
          }
          break;
        }
        case 'a':
          handleParamsChange({ angle: Math.max(0, params.angle - 15) });
          break;
        case 'd':
          handleParamsChange({ angle: Math.min(360, params.angle + 15) });
          break;
        case 'w':
          handleParamsChange({ speed: Math.min(5, params.speed + 0.2) });
          break;
        case 's':
          handleParamsChange({ speed: Math.max(0.1, params.speed - 0.2) });
          break;
        case '+':
        case '=':
          handleParamsChange({ volume: Math.min(100, params.volume + 10) });
          break;
        case '-':
          handleParamsChange({ volume: Math.max(0, params.volume - 10) });
          break;
        case 'c':
          switchCamera();
          break;
        case 'r':
          handleReset();
          break;
        case 'h':
          setShowHelp((prev) => !prev);
          break;
        case 'q':
        case 'escape':
          handleStop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [params, handleParamsChange, switchCamera, handleReset, handleStop]);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(Math.min(window.innerWidth, 640));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const showScanline = params.mode === 'scanline' || params.mode === 'scanline-color';

  return (
    <div className="app">
      <div className="main-content">
        {cameraError && <div className="error-message">{cameraError}</div>}

        <VideoCanvas
          ref={videoCanvasRef}
          videoRef={videoRef}
          showScanline={showScanline}
          scanlineCoords={scanlineCoords}
        />

        <Waveform data={waveformData} width={containerWidth} height={80} />

        <Controls
          params={params}
          isRunning={isRunning}
          onParamsChange={handleParamsChange}
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
          onSwitchCamera={switchCamera}
          cameraLabel={currentCameraLabel}
          showHelp={showHelp}
        />
      </div>
    </div>
  );
}

export default App;
