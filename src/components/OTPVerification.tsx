// OTP Verification Component
// Feature: Mobile number verification via OTP

import React, { useState, useRef, useEffect } from 'react';
import { Shield, Phone, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../services/apiService';

interface OTPVerificationProps {
  phoneNumber: string;
  purpose?: string;
  onVerified?: () => void;
  onCancel?: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  phoneNumber,
  purpose = 'verification',
  onVerified,
  onCancel,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [step, setStep] = useState<'send' | 'verify' | 'success' | 'error'>('send');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send OTP
  const sendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await api.otp.send(phoneNumber, purpose);
      setStep('verify');
      setCountdown(60);
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.otp.verify(phoneNumber, otpCode);
      setStep('success');
      onVerified?.();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => verifyOTP(), 300);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP
  const resendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    sendOTP();
  };

  // Format phone for display
  const maskedPhone = phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, '+91 $1****$3');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="text-blue-600" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">OTP Verification</h3>
          <p className="text-sm text-gray-600">Verify mobile number</p>
        </div>
      </div>

      {/* Send Step */}
      {step === 'send' && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Mobile Number</div>
                <div className="font-medium text-gray-800">{maskedPhone}</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            We will send a 6-digit OTP to this mobile number for verification.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={sendOTP}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Send OTP'
              )}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Verify Step */}
      {(step === 'verify' || step === 'error') && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter the 6-digit OTP sent to <strong>{maskedPhone}</strong>
          </p>

          {/* OTP Input */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  step === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <XCircle size={16} />
              {error}
            </div>
          )}

          <button
            onClick={verifyOTP}
            disabled={loading || otp.some(d => d === '')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Verify OTP'
            )}
          </button>

          {/* Resend */}
          <div className="text-center text-sm text-gray-600">
            {countdown > 0 ? (
              <span>Resend OTP in {countdown}s</span>
            ) : (
              <button
                onClick={resendOTP}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
              >
                <RefreshCw size={14} />
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-green-800">Verified!</h4>
            <p className="text-sm text-gray-600 mt-1">
              Mobile number {maskedPhone} has been verified successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;
