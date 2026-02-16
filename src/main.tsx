import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/arraySafety' // Array safety patches - MUST BE FIRST
import App from './App.tsx'
import { ReactQueryProvider } from './config/reactQuery.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SaasProvider } from './contexts/SaasContext.tsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.tsx'

// Wait for patches to load
function waitForPatches() {
  return new Promise(resolve => {
    if (window.__PATCHES_LOADED__) {
      resolve(true);
    } else {
      const check = setInterval(() => {
        if (window.__PATCHES_LOADED__) {
          clearInterval(check);
          resolve(true);
        }
      }, 10);
      
      // Timeout after 1 second
      setTimeout(() => {
        clearInterval(check);
        console.warn('⚠️ Patches not loaded, proceeding anyway');
        window.__PATCHES_LOADED__ = true;
        resolve(true);
      }, 1000);
    }
  });
}

// Mark patches as loaded
window.__PATCHES_LOADED__ = true;

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
waitForPatches().then(() => {
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
});
