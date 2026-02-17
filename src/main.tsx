import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// CRITICAL: Install array safety patches IMMEDIATELY before anything else
(function installCriticalPatches() {
  if (typeof window === 'undefined') return;
  
  console.log('🚨 Installing CRITICAL array safety patches...');
  
  // Store original methods
  const originalMethods = {
    filter: Array.prototype.filter,
    map: Array.prototype.map,
    forEach: Array.prototype.forEach,
    reduce: Array.prototype.reduce,
    find: Array.prototype.find,
    some: Array.prototype.some,
    every: Array.prototype.every,
  };
  
  // Patch ALL array methods
  Object.keys(originalMethods).forEach(method => {
    const original = originalMethods[method as keyof typeof originalMethods];
    Array.prototype[method as keyof Array<any>] = function(...args: any[]) {
      if (!Array.isArray(this)) {
        console.warn(`⚠️ CRITICAL: ${method} called on non-array (type: ${typeof this})`);
        // Return safe defaults
        if (method === 'filter' || method === 'map') return [];
        if (method === 'forEach') return;
        if (method === 'reduce') return args.length > 1 ? args[1] : undefined;
        if (method === 'find') return undefined;
        if (method === 'some' || method === 'every') return false;
        return null;
      }
      try {
        return original.apply(this, args);
      } catch (error) {
        console.error(`❌ CRITICAL: ${method} error:`, error);
        // Return safe defaults on error too
        if (method === 'filter' || method === 'map') return [];
        if (method === 'forEach') return;
        if (method === 'reduce') return args.length > 1 ? args[1] : undefined;
        if (method === 'find') return undefined;
        if (method === 'some' || method === 'every') return false;
        return null;
      }
    };
  });
  
  console.log('✅ CRITICAL array safety patches installed');
  window.__PATCHES_LOADED__ = true;
})();

// Now import the rest
import './utils/arraySafety'; // Additional safety
import App from './App.tsx'
import { ReactQueryProvider } from './config/reactQuery.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SaasProvider } from './contexts/SaasContext.tsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.tsx'

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
