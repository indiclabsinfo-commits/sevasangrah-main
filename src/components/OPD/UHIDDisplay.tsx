import React, { useState } from 'react';

interface UHIDDisplayProps {
  uhid: string;
  patientName?: string;
  size?: 'small' | 'medium' | 'large';
  showCopy?: boolean;
  className?: string;
}

export const UHIDDisplay: React.FC<UHIDDisplayProps> = ({
  uhid,
  patientName,
  size = 'medium',
  showCopy = true,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(uhid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
            Patient UHID
          </p>
          <p className={`font-bold text-blue-600 font-mono tracking-wider ${sizeClasses[size]}`}>
            {uhid}
          </p>
          {patientName && (
            <p className="text-sm text-gray-700 mt-1">
              {patientName}
            </p>
          )}
        </div>

        {showCopy && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title="Copy UHID to clipboard"
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Visual indicator bar */}
      <div className="mt-3 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
    </div>
  );
};

export default UHIDDisplay;
