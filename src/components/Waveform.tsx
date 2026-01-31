import { useRef, useEffect } from 'react';

interface WaveformProps {
  data: Float32Array | null;
  width: number;
  height: number;
}

export function Waveform({ data, width, height }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const step = Math.ceil(data.length / width);
    const centerY = height / 2;

    for (let i = 0; i < width; i++) {
      const dataIndex = i * step;
      const value = data[dataIndex] || 0;
      const y = centerY + value * centerY * 0.9;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }

    ctx.stroke();
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="waveform-canvas"
    />
  );
}
