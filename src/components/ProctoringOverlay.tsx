'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ProctoringOverlayProps {
  isExamActive: boolean;
  currentQuestionIndex: number;
}

export default function ProctoringOverlay({ isExamActive, currentQuestionIndex }: ProctoringOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCountRef = useRef(0);
  // Use a ref to track active state so callbacks never have stale closures
  const isActiveRef = useRef(false);
  const questionRef = useRef(currentQuestionIndex);

  // Keep questionRef in sync
  useEffect(() => {
    questionRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Capture and upload a frame
  const captureAndUpload = useCallback(async () => {
    // Use the REF, not the state, to avoid stale closure
    if (!videoRef.current || !canvasRef.current || !isActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Make sure the video has actual dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.75);
    });

    if (!blob) return;

    captureCountRef.current += 1;
    const timestamp = new Date().toISOString();

    // Prepare FormData for upload
    const formData = new FormData();
    formData.append('image', blob, `capture_${Date.now()}.jpg`);
    formData.append('questionNumber', questionRef.current.toString());
    formData.append('timestamp', timestamp);
    formData.append('userAgent', navigator.userAgent);

    // Fire-and-forget upload
    fetch('/api/upload', {
      method: 'POST',
      body: formData
    }).then(res => {
      if (!res.ok) console.error('Upload response not OK:', res.status);
    }).catch((err) => {
      console.error('Upload fetch error:', err);
    });

  }, []); // No dependencies needed - we use refs

  // Start periodic capture
  const startCapturing = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Capture every 15 seconds
    intervalRef.current = setInterval(captureAndUpload, 15000);
    // First capture after 2 seconds (give video time to initialize)
    setTimeout(captureAndUpload, 2000);
  }, [captureAndUpload]);

  // Initialize camera with auto-retry for Strict Mode race condition
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initCamera = useCallback(async (retryCount = 0) => {
    if (!isExamActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      isActiveRef.current = true;
      setIsActive(true);
      setErrorMsg(null);

      // Now start capturing - the ref is already true so captures will work
      startCapturing();

    } catch (err) {
      const error = err as Error;
      console.error('Camera init error:', error.name, error.message);
      isActiveRef.current = false;
      setIsActive(false);

      // NotReadableError usually means the camera is still releasing from a previous mount.
      // Auto-retry up to 3 times with increasing delays.
      if (error.name === 'NotReadableError' && retryCount < 3) {
        const delay = 1000 * (retryCount + 1); // 1s, 2s, 3s
        console.log(`Camera busy, auto-retrying in ${delay}ms (attempt ${retryCount + 1}/3)...`);
        setErrorMsg(`Camera initializing... (attempt ${retryCount + 1}/3)`);
        retryTimeoutRef.current = setTimeout(() => initCamera(retryCount + 1), delay);
        return;
      }

      if (error.name === 'NotReadableError') {
        setErrorMsg('Camera is busy. Close other apps using your webcam (Zoom, Teams, etc.) then click Retry.');
      } else if (error.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setErrorMsg('No camera detected. Please connect a webcam.');
      } else {
        setErrorMsg(`Camera error: ${error.name} - ${error.message}`);
      }
    }
  }, [isExamActive, startCapturing]);

  // Stop everything
  const stopCamera = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isActiveRef.current = false;
    setIsActive(false);
  }, []);

  // Start/stop based on exam state
  useEffect(() => {
    if (isExamActive) {
      initCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isExamActive, initCamera, stopCamera]);

  return (
    <>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Proctoring panel - visible to the user */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 max-w-[260px]">
        {errorMsg ? (
          <div>
            <p className="text-red-600 font-bold text-xs mb-2">⚠️ {errorMsg}</p>
            <button
              onClick={() => { setErrorMsg(null); initCamera(); }}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded"
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                isActive 
                  ? 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]' 
                  : 'bg-gray-400'
              }`} />
              <span className={isActive ? 'text-red-600' : 'text-gray-400'}>
                {isActive ? 'Recording Active' : 'Initializing...'}
              </span>
            </div>
            {/* Visible video self-view so the browser renders frames */}
            <video
              ref={videoRef}
              style={{ display: 'none' }}
              autoPlay
              playsInline
              muted
              className="w-44 h-32 object-cover rounded bg-gray-900 border border-gray-300"
            />
          </>
        )}
      </div>
    </>
  );
}