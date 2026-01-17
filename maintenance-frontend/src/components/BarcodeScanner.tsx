import { useState, useEffect, useRef, useCallback } from 'react';

// Type declarations for BarcodeDetector API
interface BarcodeFormat {
  format: string;
  rawValue: string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: { x: number; y: number }[];
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  detect(image: ImageBitmapSource): Promise<BarcodeFormat[]>;
  static getSupportedFormats(): Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }
}

export type ScanMode = 'asset' | 'inventory' | 'all';

export interface ScanResult {
  rawValue: string;
  format: string;
  timestamp: Date;
  mode: ScanMode;
}

interface BarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  mode?: ScanMode;
  className?: string;
  enabled?: boolean;
}

// Supported barcode formats
const SUPPORTED_FORMATS = [
  'qr_code',
  'code_128',
  'code_39',
  'code_93',
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'itf',
  'codabar',
  'data_matrix',
  'pdf417',
  'aztec',
];

export const BarcodeScanner = ({
  onScan,
  onError,
  onClose,
  mode = 'all',
  className = '',
  enabled = true,
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [scanLinePosition, setScanLinePosition] = useState<number>(0);

  // Animate scan line
  useEffect(() => {
    if (!enabled || isLoading) return;

    let position = 0;
    let direction = 1;
    const interval = setInterval(() => {
      position += direction * 2;
      if (position >= 100) direction = -1;
      if (position <= 0) direction = 1;
      setScanLinePosition(position);
    }, 30);

    return () => clearInterval(interval);
  }, [enabled, isLoading]);

  // Check for BarcodeDetector API support
  const checkBarcodeDetectorSupport = useCallback(async (): Promise<boolean> => {
    if ('BarcodeDetector' in window) {
      try {
        const formats = await window.BarcodeDetector!.getSupportedFormats();
        return formats.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Initialize camera stream
  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        throw new Error('Camera not supported on this device');
      }

      // Request camera permission
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check for torch support
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setHasTorchSupport(!!capabilities?.torch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize BarcodeDetector
      const hasDetector = await checkBarcodeDetectorSupport();
      setHasBarcodeDetector(hasDetector);

      if (hasDetector) {
        try {
          const supportedFormats = await window.BarcodeDetector!.getSupportedFormats();
          const formatsToUse = SUPPORTED_FORMATS.filter(f => supportedFormats.includes(f));
          detectorRef.current = new window.BarcodeDetector!({ formats: formatsToUse });
        } catch (err) {
          console.warn('Failed to initialize BarcodeDetector with formats:', err);
          detectorRef.current = new window.BarcodeDetector!();
        }
      }

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      setHasCamera(false);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [facingMode, checkBarcodeDetectorSupport, onError]);

  // Toggle torch/flashlight
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !hasTorchSupport) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !torchEnabled } as MediaTrackConstraintSet],
      });
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  }, [hasTorchSupport, torchEnabled]);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  // Scan for barcodes
  const scanForBarcodes = useCallback(async () => {
    if (!enabled || !videoRef.current || !detectorRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanForBarcodes);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const barcodes = await detectorRef.current.detect(canvas);

      if (barcodes.length > 0) {
        const barcode = barcodes[0];
        const now = Date.now();

        // Debounce: prevent duplicate scans within 2 seconds
        if (barcode.rawValue !== lastScanRef.current || now - lastScanTimeRef.current > 2000) {
          lastScanRef.current = barcode.rawValue;
          lastScanTimeRef.current = now;

          const result: ScanResult = {
            rawValue: barcode.rawValue,
            format: barcode.format,
            timestamp: new Date(),
            mode: mode,
          };

          onScan(result);
        }
      }
    } catch (err) {
      console.error('Barcode detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(scanForBarcodes);
  }, [enabled, mode, onScan]);

  // Initialize on mount and when facingMode changes
  useEffect(() => {
    if (enabled) {
      initializeCamera();
    }

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, initializeCamera]);

  // Start scanning when ready
  useEffect(() => {
    if (!isLoading && enabled && hasBarcodeDetector && hasCamera) {
      animationFrameRef.current = requestAnimationFrame(scanForBarcodes);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoading, enabled, hasBarcodeDetector, hasCamera, scanForBarcodes]);

  // Mode label
  const getModeLabel = () => {
    switch (mode) {
      case 'asset':
        return 'Scanning for Asset QR Codes';
      case 'inventory':
        return 'Scanning for Inventory Barcodes';
      default:
        return 'Scanning for Codes';
    }
  };

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      {/* Camera viewport */}
      <div className="relative aspect-[4/3] w-full">
        {/* Video element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Hidden canvas for barcode detection */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {!isLoading && hasCamera && (
          <div className="absolute inset-0">
            {/* Dark overlay with transparent center */}
            <div className="absolute inset-0">
              {/* Top overlay */}
              <div className="absolute top-0 left-0 right-0 h-1/4 bg-black/50" />
              {/* Bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-black/50" />
              {/* Left overlay */}
              <div className="absolute top-1/4 left-0 w-1/6 h-1/2 bg-black/50" />
              {/* Right overlay */}
              <div className="absolute top-1/4 right-0 w-1/6 h-1/2 bg-black/50" />
            </div>

            {/* Viewfinder frame */}
            <div className="absolute top-1/4 left-1/6 right-1/6 bottom-1/4">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

              {/* Animated scan line */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-transform duration-75"
                style={{ top: `${scanLinePosition}%` }}
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
            <p className="text-white text-sm">Initializing camera...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6">
            <svg
              className="w-16 h-16 text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-white text-center mb-4">{error}</p>
            <button
              onClick={initializeCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No BarcodeDetector support warning */}
        {!hasBarcodeDetector && !isLoading && hasCamera && (
          <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-xs px-4 py-2 text-center">
            BarcodeDetector API not supported. Manual entry recommended.
          </div>
        )}

        {/* Mode indicator */}
        {!isLoading && hasCamera && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full">
            {getModeLabel()}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
        {/* Switch camera button */}
        <button
          onClick={switchCamera}
          className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition"
          title="Switch Camera"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Torch button */}
        {hasTorchSupport && (
          <button
            onClick={toggleTorch}
            className={`p-3 rounded-full transition ${
              torchEnabled
                ? 'bg-yellow-500 text-yellow-900'
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            }`}
            title="Toggle Flashlight"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {torchEnabled ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              )}
            </svg>
          </button>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-3 bg-red-500/80 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition"
            title="Close Scanner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
