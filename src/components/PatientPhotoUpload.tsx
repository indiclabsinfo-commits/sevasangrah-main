// Patient Photo Upload Component
// Feature #9: Patient photo upload

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Check, AlertCircle, RotateCw, ZoomIn, Download } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PatientPhotoUploadProps {
  patientId: string;
  patientName?: string;
  existingPhotoUrl?: string;
  existingThumbnailUrl?: string;
  onPhotoUploaded?: (photoData: {
    photo_url: string;
    photo_thumbnail_url: string;
    photo_uploaded_at: string;
  }) => void;
  onPhotoRemoved?: () => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PatientPhotoUpload: React.FC<PatientPhotoUploadProps> = ({
  patientId,
  patientName = 'Patient',
  existingPhotoUrl,
  existingThumbnailUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  readOnly = false,
  size = 'md'
}) => {
  // State
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhotoUrl || null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(existingThumbnailUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-32 h-32', avatar: 'w-24 h-24', icon: 20 },
    md: { container: 'w-48 h-48', avatar: 'w-36 h-36', icon: 24 },
    lg: { container: 'w-64 h-64', avatar: 'w-48 h-48', icon: 32 }
  };
  
  const config = sizeConfig[size];

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadPhoto(file);
  };

  // Upload photo to Supabase Storage
  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      logger.log('📸 Uploading patient photo:', { patientId, fileName: file.name });

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}-${Date.now()}.${fileExt}`;
      const filePath = `patient-photos/${patientId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('bucket')) {
          logger.log('🪣 Storage bucket not found, attempting to create...');
          // Note: Bucket creation requires admin privileges
          // For now, we'll show a helpful error
          setError('Storage bucket not configured. Please create "patient-photos" bucket in Supabase Storage.');
          setUploading(false);
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(filePath);

      logger.log('✅ Photo uploaded successfully:', publicUrl);

      // Create thumbnail (simplified - in production, use image processing)
      const thumbnailUrl = publicUrl; // Same URL for now

      // Update patient record in database
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          photo_url: publicUrl,
          photo_thumbnail_url: thumbnailUrl,
          photo_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPreviewUrl(publicUrl);
      setThumbnailUrl(thumbnailUrl);
      setSuccess('Photo uploaded successfully!');

      // Callback
      if (onPhotoUploaded) {
        onPhotoUploaded({
          photo_url: publicUrl,
          photo_thumbnail_url: thumbnailUrl,
          photo_uploaded_at: new Date().toISOString()
        });
      }

      logger.log('✅ Patient photo metadata updated');
    } catch (error: any) {
      logger.error('❌ Error uploading photo:', error);
      setError(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Remove photo
  const removePhoto = async () => {
    try {
      if (!previewUrl) return;

      setUploading(true);
      setError(null);

      // Extract filename from URL
      const urlParts = previewUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `patient-photos/${patientId}/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('patient-photos')
        .remove([filePath]);

      if (deleteError) {
        logger.warn('⚠️ Could not delete from storage:', deleteError);
        // Continue anyway to update database
      }

      // Update patient record
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          photo_url: null,
          photo_thumbnail_url: null,
          photo_uploaded_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPreviewUrl(null);
      setThumbnailUrl(null);
      setSuccess('Photo removed successfully');

      // Callback
      if (onPhotoRemoved) {
        onPhotoRemoved();
      }

      logger.log('✅ Patient photo removed');
    } catch (error: any) {
      logger.error('❌ Error removing photo:', error);
      setError(`Remove failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Capture photo from webcam
  const captureFromWebcam = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Webcam access not available in this browser');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        setError(`Webcam error: ${err.message}`);
      });
  };

  // Take snapshot from webcam
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and upload
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
      uploadPhoto(file);

      // Stop webcam
      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    }, 'image/jpeg', 0.9);
  };

  // Trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Download photo
  const downloadPhoto = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `patient-${patientId}-photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={uploading || readOnly}
      />

      {/* Main Container */}
      <div className={`relative ${config.container} mx-auto`}>
        {/* Photo Preview / Avatar */}
        <div className="relative">
          {previewUrl ? (
            <div className="relative group">
              <img
                src={previewUrl}
                alt={`${patientName}'s photo`}
                className={`${config.avatar} object-cover rounded-full border-4 border-white shadow-lg mx-auto cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => setShowPreview(true)}
              />
              
              {/* Overlay actions */}
              {!readOnly && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="View larger"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      onClick={downloadPhoto}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={removePhoto}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Remove photo"
                      disabled={uploading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`${config.avatar} bg-gray-200 rounded-full border-4 border-white shadow-lg mx-auto flex items-center justify-center`}>
              <User size={config.icon} className="text-gray-400" />
            </div>
          )}

          {/* Upload/Change Button */}
          {!readOnly && (
            <button
              onClick={triggerFileInput}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
              title={previewUrl ? "Change photo" : "Upload photo"}
            >
              {uploading ? (
                <RotateCw size={16} className="animate-spin" />
              ) : previewUrl ? (
                <Camera size={16} />
              ) : (
                <Upload size={16} />
              )}
            </button>
          )}
        </div>

        {/* Patient Name */}
        <div className="text-center mt-3">
          <div className="font-medium text-gray-800 truncate">{patientName}</div>
          <div className="text-xs text-gray-500">Patient ID: {patientId.substring(0, 8)}...</div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <Check size={16} />
            <span className="text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Processing...</span>
        </div>
      )}

      {/* Webcam Capture (Advanced Feature) */}
      {!readOnly && false && ( // Disabled for now
        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Or capture from webcam</div>
          <div className="space-y-3">
            <video
              ref={videoRef}
              className="w-full rounded-lg border border-gray-300"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <button
                onClick={captureFromWebcam}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Start Camera
              </button>
              <button
                onClick={takeSnapshot}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Take Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Requirements */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle size={12} className="text-gray-400 mt-0.5" />
          <div>
            <span className="font-medium">Photo Requirements:</span>
            <ul className="mt-1 space-y-1">
              <li>• Clear face photo (passport style)</li>
              <li>• Good lighting, neutral background</li>
              <li>• File size: Max 5MB</li>
              <li>• Formats: JPEG, PNG, WebP</li>
              <li>• Recommended: 500x500 pixels minimum</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-medium text-gray-800">
                {patientName}'s Photo
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <img
                src={previewUrl}
                alt={`${patientName}'s photo`}
                className="max-w-full max-h-[70vh] mx-auto rounded-lg"
              />
            </div>
            <div className="p-4 border-t flex justify-between">
              <button
                onClick={downloadPhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
              <button
                onClick={() => setShowPreview(false)}
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPhotoUpload;