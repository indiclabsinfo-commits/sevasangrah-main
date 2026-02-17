import React from 'react';

const ComingSoon: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Feature Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          This feature is currently being optimized for better performance.
          It will be available in the next update.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> All core patient management features remain available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
