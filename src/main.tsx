import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/arraySafety' // Array safety patches - MUST BE FIRST
import App from './App.tsx'
import { ReactQueryProvider } from './config/reactQuery.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SaasProvider } from './contexts/SaasContext.tsx'
import GlobalErrorBoundary from './components/GlobalErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ReactQueryProvider>
        <SaasProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SaasProvider>
      </ReactQueryProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
