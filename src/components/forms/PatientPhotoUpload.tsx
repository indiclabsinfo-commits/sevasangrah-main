import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/apiService';

interface PatientPhotoUploadProps {
  value?: string | null;
  onChange: (photoUrl: string | null) => void;
  patientId?: string;
  disabled?: boolean;
}

export const PatientPhotoUpload: React.FC<PatientPhotoUploadProps> = ({
  value,
  onChange,
  patientId,
  disabled = false,
}) => {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload blob to backend, fall back to DataURL if backend unavailable
  const uploadPhoto = async (blob: Blob): Promise<string> => {
    if (patientId) {
      try {
        const result = await api.patients.uploadPhoto(patientId, blob);
        return result.photoUrl;
      } catch (err) {
        console.warn('Backend photo upload failed, using DataURL fallback:', err);
      }
    }
    // Fallback: convert to DataURL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // Resize image on canvas and return blob
  const resizeToBlob = (source: HTMLVideoElement | HTMLImageElement): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const maxSize = 400;
      let width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      let height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

      if (width > height) {
        if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
      } else {
        if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.6);
    });
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      setShowCameraModal(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => console.error('Error playing video:', err));
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found on this device.');
        } else {
          toast.error('Failed to access camera. Please check permissions.');
        }
      } else {
        toast.error('Failed to access camera. Please check permissions.');
      }
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    setUploading(true);
    try {
      const blob = await resizeToBlob(videoRef.current);
      const url = await uploadPhoto(blob);
      onChange(url);
      stopCamera();
      toast.success('Photo captured successfully!');
    } catch (err) {
      toast.error('Failed to capture photo');
    } finally {
      setUploading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = URL.createObjectURL(file);
      });

      const blob = await resizeToBlob(img);
      URL.revokeObjectURL(img.src);
      const url = await uploadPhoto(blob);
      onChange(url);
      toast.success('Photo uploaded and optimized!');
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Remove photo
  const removePhoto = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Photo removed');
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
        Patient Photo (Optional)
      </label>

      <div className="flex items-center gap-4">
        {/* Photo Preview */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '8px',
            border: '2px solid #CCCCCC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: '#F5F7FA',
          }}
        >
          {value ? (
            <img
              src={value}
              alt="Patient"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <User className="w-12 h-12" style={{ color: '#CCCCCC' }} />
          )}
        </div>

        {/* Upload Options */}
        <div className="flex flex-col gap-2">
          {/* Upload from Device */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#0056B3',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '600',
              cursor: disabled || uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: disabled || uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !disabled && !uploading && (e.currentTarget.style.backgroundColor = '#004494')}
            onMouseLeave={(e) => !disabled && !uploading && (e.currentTarget.style.backgroundColor = '#0056B3')}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload from Device
              </>
            )}
          </button>

          {/* Capture with Camera */}
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled || uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              color: '#0056B3',
              border: '2px solid #0056B3',
              fontWeight: '600',
              cursor: disabled || uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: disabled || uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !disabled && !uploading && (e.currentTarget.style.backgroundColor = '#F0F7FF')}
            onMouseLeave={(e) => !disabled && !uploading && (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <Camera className="w-4 h-4" />
            Capture Live Photo
          </button>

          {/* Remove Photo */}
          {value && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#EF4444',
                border: '2px solid #EF4444',
                fontWeight: '600',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: disabled ? 0.6 : 1,
              }}
              onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = '#FEF2F2')}
              onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <X className="w-4 h-4" />
              Remove Photo
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Camera Modal */}
      {showCameraModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '640px',
              width: '90%',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333333' }}>
                Capture Patient Photo
              </h3>
              <button
                onClick={stopCamera}
                style={{
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#F5F5F5',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E5E5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F5')}
              >
                <X className="w-5 h-5" style={{ color: '#333333' }} />
              </button>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxHeight: '480px',
                borderRadius: '8px',
                backgroundColor: '#000000',
                marginBottom: '16px',
                display: 'block',
              }}
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                video.play().catch(err => console.error('Play error:', err));
              }}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={stopCamera}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#E0E0E0',
                  color: '#333333',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D0D0D0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E0E0E0')}
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={uploading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#0056B3',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  opacity: uploading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => !uploading && (e.currentTarget.style.backgroundColor = '#004494')}
                onMouseLeave={(e) => !uploading && (e.currentTarget.style.backgroundColor = '#0056B3')}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 inline mr-2" />
                    Capture Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
