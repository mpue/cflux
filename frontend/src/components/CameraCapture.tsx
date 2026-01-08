import React, { useState, useRef, useEffect } from 'react';
import './CameraCapture.css';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Kamera-Zugriff fehlgeschlagen:', err);
      setError('Kamera-Zugriff verweigert. Bitte Berechtigung erteilen.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageUrl);
        setCapturedBlob(blob);
        console.log('Photo captured, blob saved:', blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const confirmPhoto = () => {
    console.log('confirmPhoto called');
    if (!capturedBlob) {
      console.error('No captured blob available');
      return;
    }

    console.log('Creating file from saved blob');
    const file = new File([capturedBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    console.log('File created, calling onCapture', file);
    onCapture(file);
    stopCamera();
    // onClose wird vom Parent (EHSTodos) nach erfolgreichem Upload aufgerufen
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  return (
    <div className="camera-capture-overlay">
      <div className="camera-capture-container">
        <div className="camera-header">
          <h3>📸 Foto aufnehmen</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="camera-error">
            {error}
          </div>
        )}

        <div className="camera-viewport">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </>
          ) : (
            <img src={capturedImage} alt="Captured" className="captured-image" />
          )}
        </div>

        <div className="camera-controls">
          {!capturedImage ? (
            <>
              <button className="btn-camera-action" onClick={switchCamera} title="Kamera wechseln">
                🔄
              </button>
              <button className="btn-capture" onClick={capturePhoto}>
                📷
              </button>
              <button className="btn-camera-action" onClick={onClose}>
                ❌
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={retakePhoto}>
                Erneut aufnehmen
              </button>
              <button className="btn-primary" onClick={confirmPhoto}>
                Foto verwenden
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
