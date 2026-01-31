import { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from './hooks/useCamera';
import { AudioEngine } from './audio/AudioEngine';
import { Controls } from './components/Controls';
import { Waveform } from './components/Waveform';
import { VideoCanvas, type VideoCanvasHandle } from './components/VideoCanvas';
import { PatternGenerator, type PatternGeneratorHandle } from './components/PatternGenerator';
import { DEFAULT_PARAMS, SYNTH_MODES, DEFAULT_SYNTH_PARAMS, DEFAULT_PATTERN_PARAMS } from './types';
import type { SynthParams, SynthMode, PatternParams, InputSource } from './types';
import './App.css';

function App() {
  const [inputSource, setInputSource] = useState<InputSource>(DEFAULT_PARAMS.inputSource);
  const [synthParams, setSynthParams] = useState<SynthParams>(DEFAULT_SYNTH_PARAMS);
  const [patternParams, setPatternParams] = useState<PatternParams>(DEFAULT_PATTERN_PARAMS);
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
  const patternRef = useRef<PatternGeneratorHandle>(null);
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

  const handleSynthChange = useCallback((newParams: Partial<SynthParams>) => {
    setSynthParams((prev) => {
      const updated = { ...prev, ...newParams };
      if (audioEngineRef.current && newParams.volume !== undefined) {
        audioEngineRef.current.setVolume(updated.volume);
      }
      return updated;
    });
  }, []);

  const handlePatternChange = useCallback((newParams: Partial<PatternParams>) => {
    setPatternParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  const handleInputSourceChange = useCallback((source: InputSource) => {
    setInputSource(source);
  }, []);

  const processFrame = useCallback(() => {
    if (!isRunning || !audioEngineRef.current) {
      return;
    }

    const sourceRef = inputSource === 'generator' ? patternRef : videoCanvasRef;
    if (!sourceRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const imageData = sourceRef.current.getImageData();
    if (!imageData) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const engine = audioEngineRef.current;
    let coords = null;

    switch (synthParams.mode) {
      case 'additive':
        engine.synthesizeAdditive(imageData, synthParams);
        break;
      case 'spectral':
        engine.synthesizeSpectral(imageData, synthParams);
        break;
      case 'scanline':
        coords = engine.synthesizeScanline(imageData, synthParams);
        break;
      case 'scanline-color':
        coords = engine.synthesizeScanlineColor(imageData, synthParams);
        break;
      case 'rgb-additive':
        engine.synthesizeRGBAdditive(imageData, synthParams);
        break;
      case 'hsv':
        engine.synthesizeHSV(imageData, synthParams);
        break;
      case 'pulse':
        engine.synthesizePulse(imageData, synthParams);
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
  }, [isRunning, synthParams, inputSource]);

  const handleStart = useCallback(async () => {
    if (inputSource === 'camera') {
      await startCamera();
    }

    const engine = new AudioEngine();
    await engine.initialize(synthParams);
    audioEngineRef.current = engine;

    setIsRunning(true);
  }, [startCamera, synthParams, inputSource]);

  const handleStop = useCallback(() => {
    setIsRunning(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
      audioEngineRef.current = null;
    }

    if (inputSource === 'camera') {
      stopCamera();
    }
    setScanlineCoords(null);
    setWaveformData(null);
  }, [stopCamera, inputSource]);

  const handleReset = useCallback(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.reset(synthParams);
    }
    setScanlineCoords(null);
  }, [synthParams]);

  useEffect(() => {
    const shouldRun = inputSource === 'generator' ? isRunning : isRunning && cameraActive;
    if (shouldRun) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, cameraActive, processFrame, inputSource]);

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
            handleSynthChange({ mode: SYNTH_MODES[modeIndex].id as SynthMode });
          }
          break;
        }
        case 'a':
          handleSynthChange({ angle: Math.max(0, synthParams.angle - 15) });
          break;
        case 'd':
          handleSynthChange({ angle: Math.min(360, synthParams.angle + 15) });
          break;
        case 'w':
          handleSynthChange({ speed: Math.min(5, synthParams.speed + 0.2) });
          break;
        case 's':
          handleSynthChange({ speed: Math.max(0.1, synthParams.speed - 0.2) });
          break;
        case '+':
        case '=':
          handleSynthChange({ volume: Math.min(100, synthParams.volume + 10) });
          break;
        case '-':
          handleSynthChange({ volume: Math.max(0, synthParams.volume - 10) });
          break;
        case 'g':
          setInputSource((prev) => (prev === 'generator' ? 'camera' : 'generator'));
          break;
        case 'c':
          if (inputSource === 'camera') {
            switchCamera();
          }
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
  }, [synthParams, inputSource, handleSynthChange, switchCamera, handleReset, handleStop]);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(Math.min(window.innerWidth, 640));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const showScanline = synthParams.mode === 'scanline' || synthParams.mode === 'scanline-color';

  return (
    <div className="app">
      <div className="main-content">
        {inputSource === 'camera' && cameraError && (
          <div className="error-message">{cameraError}</div>
        )}

        {inputSource === 'generator' ? (
          <PatternGenerator
            ref={patternRef}
            params={patternParams}
            showScanline={showScanline}
            scanlineCoords={scanlineCoords}
            isRunning={isRunning}
          />
        ) : (
          <VideoCanvas
            ref={videoCanvasRef}
            videoRef={videoRef}
            showScanline={showScanline}
            scanlineCoords={scanlineCoords}
          />
        )}

        <Waveform data={waveformData} width={containerWidth} height={80} />

        <Controls
          synthParams={synthParams}
          patternParams={patternParams}
          inputSource={inputSource}
          isRunning={isRunning}
          onSynthChange={handleSynthChange}
          onPatternChange={handlePatternChange}
          onInputSourceChange={handleInputSourceChange}
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
