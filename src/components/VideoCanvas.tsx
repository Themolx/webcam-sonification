import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

interface ScanlineCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showScanline: boolean;
  scanlineCoords: ScanlineCoords | null;
}

export interface VideoCanvasHandle {
  getImageData: () => ImageData | null;
  getWidth: () => number;
  getHeight: () => number;
}

export const VideoCanvas = forwardRef<VideoCanvasHandle, VideoCanvasProps>(
  ({ videoRef, showScanline, scanlineCoords }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      getImageData: () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return null;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      },
      getWidth: () => canvasRef.current?.width || 640,
      getHeight: () => canvasRef.current?.height || 480,
    }));

    useEffect(() => {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;

      const ctx = overlay.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, overlay.width, overlay.height);

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
      <div className="video-container">
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          className="video-element"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="hidden-canvas"
        />
        <canvas
          ref={overlayCanvasRef}
          width={640}
          height={480}
          className="overlay-canvas"
        />
      </div>
    );
  }
);

VideoCanvas.displayName = 'VideoCanvas';
