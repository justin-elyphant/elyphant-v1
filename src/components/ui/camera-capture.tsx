import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isVideoReady, setIsVideoReady] = useState(false);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setHasPermission(null);
      setIsVideoReady(false);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        const onReady = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setIsVideoReady(true);
          }
        };
        video.addEventListener('loadedmetadata', onReady);
        video.addEventListener('canplay', onReady);
        try { await video.play(); } catch (_) {}
      }
      
      setHasPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      toast.error('Could not access camera. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (!isVideoReady || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      toast.error('Camera is not ready yet. Please wait a moment and try again.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Produce a data URL for preview and a Blob for saving
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);

      // Create Blob asynchronously as well
      canvas.toBlob(async (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        } else {
          // Fallback: convert dataURL to Blob
          try {
            const res = await fetch(dataUrl);
            const fallbackBlob = await res.blob();
            setCapturedBlob(fallbackBlob);
          } catch (e) {
            console.error('Failed to create blob from data URL', e);
          }
        }
      }, 'image/jpeg', 0.9);
    } catch (e) {
      console.error('Failed to capture image (toDataURL):', e);
      // Fallback to Blob + Object URL
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);
        } else {
          toast.error('Failed to capture image. Please try again.');
        }
      }, 'image/jpeg', 0.9);
    }
  };
  const confirmCapture = async () => {
    if (!capturedImage) return;

    // Prefer the captured Blob if available
    if (capturedBlob) {
      onCapture(capturedBlob);
      // Close immediately and cleanup
      stopCamera();
      setCapturedImage(null);
      setCapturedBlob(null);
      onClose();
      return;
    }

    // Fallback: convert data URL or object URL to Blob
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      onCapture(blob);
      // Close immediately and cleanup
      stopCamera();
      setCapturedImage(null);
      setCapturedBlob(null);
      onClose();
    } catch (e) {
      console.error('Failed to use captured photo', e);
      toast.error('Failed to use photo. Please try again.');
    }
  };

  const retakePhoto = () => {
    if (capturedImage && capturedImage.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCapturedBlob(null);
    setHasPermission(null);
    setIsVideoReady(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      setIsVideoReady(false);
      initializeCamera();
    }
    
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, facingMode, capturedImage]);

  // Ensure we only allow capture once video has valid dimensions
  useEffect(() => {
    if (!isOpen || capturedImage) return;
    const video = videoRef.current;
    if (!video) return;

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setIsVideoReady(true);
      }
    };

    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('canplay', onReady);

    return () => {
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('canplay', onReady);
    };
  }, [isOpen, capturedImage, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage && capturedImage.startsWith('blob:')) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} modal={false} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent aria-describedby="camera-desc" className="max-w-md w-full mx-auto p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 pb-2 flex-shrink-0">
          <DialogTitle className="text-center">Take Photo</DialogTitle>
        </DialogHeader>
        <p id="camera-desc" className="sr-only">Use your camera to take a profile photo. The capture button is disabled until the camera is ready.</p>
        
        <div className="relative aspect-square bg-black mx-4 rounded-lg overflow-hidden">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {(isLoading || !isVideoReady) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white">Loading camera...</div>
                </div>
              )}
              
              {hasPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-white text-center p-4">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Camera access denied</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Please enable camera permissions and try again
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
              onError={() => {
                try {
                  if (canvasRef.current) {
                    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
                    setCapturedImage(dataUrl);
                  }
                } catch (e) {
                  console.error('Preview image failed to load', e);
                  toast.error('Preview failed. Please retake the photo.');
                }
              }}
            />
          )}
        </div>
        
        <div className="p-4 flex-shrink-0">
          {!capturedImage ? (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={switchCamera}
                disabled={isLoading || hasPermission === false}
                className="rounded-full"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                size="lg"
                onClick={capturePhoto}
                disabled={isLoading || hasPermission === false || !isVideoReady}
                className="rounded-full px-8 bg-primary hover:bg-primary/90"
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                onClick={confirmCapture}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Check className="h-4 w-4 mr-2" />
                Use Photo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};