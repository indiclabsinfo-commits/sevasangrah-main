import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Array safety patches are loaded via preload-patch.js and arraySafety.ts
import './utils/arraySafety'; // Safety patches

import App from './App'
import { ReactQueryProvider } from './config/reactQuery'
import { AuthProvider } from './contexts/AuthContext'
import { SaasProvider } from './contexts/SaasContext'
import GlobalErrorBoundary from './components/GlobalErrorBoundary'

// Simple loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading hospital management system...</p>
        <p className="text-sm text-gray-500 mt-2">Initializing safety patches</p>
      </div>
    </div>
  );
}

// Start app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <ReactQueryProvider>
          <SaasProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </SaasProvider>
        </ReactQueryProvider>
      </Suspense>
    </GlobalErrorBoundary>
  </StrictMode>,
);
