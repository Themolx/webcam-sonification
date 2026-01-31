import { useEffect, useRef, useState, useCallback } from 'react';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !currentDeviceId) {
        setCurrentDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError('Failed to enumerate camera devices');
    }
  }, [currentDeviceId]);

  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: deviceId ? undefined : 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      if (settings.deviceId) {
        setCurrentDeviceId(settings.deviceId);
      }

      setIsActive(true);
      await enumerateDevices();
    } catch (err) {
      setError('Failed to access camera. Please allow camera permissions.');
      setIsActive(false);
    }
  }, [enumerateDevices]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const switchCamera = useCallback(async () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    await startCamera(devices[nextIndex].deviceId);
  }, [devices, currentDeviceId, startCamera]);

  const getImageData = useCallback((): ImageData | null => {
    if (!videoRef.current || !canvasRef.current || !isActive) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    devices,
    currentDeviceId,
    isActive,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    getImageData,
  };
}
