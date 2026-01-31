import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import type { PatternParams } from '../types';

interface ScanlineCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface PatternGeneratorProps {
  params: PatternParams;
  showScanline: boolean;
  scanlineCoords: ScanlineCoords | null;
  isRunning: boolean;
}

export interface PatternGeneratorHandle {
  getImageData: () => ImageData | null;
  getWidth: () => number;
  getHeight: () => number;
}

export const PatternGenerator = forwardRef<PatternGeneratorHandle, PatternGeneratorProps>(
  ({ params, showScanline, scanlineCoords, isRunning }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationTimeRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(0);

    const width = 640;
    const height = 480;

    const renderPattern = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const now = performance.now();
      const dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      if (isRunning) {
        animationTimeRef.current += dt;
      }

      const t = animationTimeRef.current;

      // Calculate animated values
      const rotation = params.rotation + params.animateRotation * t;
      const skewX = params.skewX + params.animateSkewX * t;
      const skewY = params.skewY + params.animateSkewY * t;
      const offsetX = params.offsetX + Math.sin(params.animateOffsetX * t) * 100;
      const offsetY = params.offsetY + Math.sin(params.animateOffsetY * t) * 100;

      // Clear canvas
      ctx.fillStyle = params.invert ? '#fff' : '#000';
      ctx.fillRect(0, 0, width, height);

      // Save context and apply transforms
      ctx.save();
      ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.transform(1, Math.tan((skewY * Math.PI) / 180), Math.tan((skewX * Math.PI) / 180), 1, 0, 0);
      ctx.scale(params.scaleX, params.scaleY);

      // Calculate grid dimensions
      const totalWidth = params.columns * (params.cellSize + params.gap) - params.gap;
      const totalHeight = params.rows * (params.cellSize + params.gap) - params.gap;

      // Draw grid of squares
      ctx.fillStyle = params.invert ? '#000' : '#fff';

      for (let row = 0; row < params.rows; row++) {
        for (let col = 0; col < params.columns; col++) {
          const x = -totalWidth / 2 + col * (params.cellSize + params.gap);
          const y = -totalHeight / 2 + row * (params.cellSize + params.gap);
          const size = params.cellSize * params.fillRatio;
          const cellOffset = (params.cellSize - size) / 2;
          const radius = (params.roundness / 100) * (size / 2);

          if (radius > 0) {
            ctx.beginPath();
            ctx.roundRect(x + cellOffset, y + cellOffset, size, size, radius);
            ctx.fill();
          } else {
            ctx.fillRect(x + cellOffset, y + cellOffset, size, size);
          }
        }
      }

      ctx.restore();
    }, [params, isRunning]);

    useImperativeHandle(ref, () => ({
      getImageData: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;

        return ctx.getImageData(0, 0, width, height);
      },
      getWidth: () => width,
      getHeight: () => height,
    }));

    // Render pattern continuously
    useEffect(() => {
      let animationId: number;

      const animate = () => {
        renderPattern();
        animationId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationId);
      };
    }, [renderPattern]);

    // Draw scanline overlay
    useEffect(() => {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;

      const ctx = overlay.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      if (showScanline && scanlineCoords) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(scanlineCoords.x1, scanlineCoords.y1);
        ctx.lineTo(scanlineCoords.x2, scanlineCoords.y2);
        ctx.stroke();
      }
    }, [showScanline, scanlineCoords]);

    return (
      <div className="pattern-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="pattern-canvas"
        />
        <canvas
          ref={overlayCanvasRef}
          width={width}
          height={height}
          className="overlay-canvas"
        />
      </div>
    );
  }
);

PatternGenerator.displayName = 'PatternGenerator';
