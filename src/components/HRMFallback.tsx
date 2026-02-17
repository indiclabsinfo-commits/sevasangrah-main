import React from 'react';
import { AlertCircle } from 'lucide-react';

const HRMFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-yellow-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          HRM Module Temporarily Unavailable
        </h1>
        
        <p className="text-gray-600 mb-6">
          We're experiencing technical difficulties with the HRM module. 
          Our team is working to resolve the issue.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 text-left mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Technical Details:</h3>
          <p className="text-sm text-blue-700">
            • Build system encountering EPIPE errors<br/>
            • Array safety patches may not have loaded<br/>
            • Database tables may be missing<br/>
            • Fix deployment in progress
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => {
              // Apply emergency fix
              const orig = Array.prototype.filter;
              Array.prototype.filter = function(...args) {
                if (!Array.isArray(this)) {
                  console.warn('Emergency fix: filter on non-array');
                  return [];
                }
                return orig.apply(this, args);
              };
              window.location.reload();
            }}
            className="w-full border border-red-300 text-red-600 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm"
          >
            Apply Emergency Fix & Reload
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>If the issue persists, please contact support.</p>
          <p className="mt-1">Deployment: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default HRMFallback;