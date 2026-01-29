import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ReactQueryProvider } from './config/reactQuery.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SaasProvider } from './contexts/SaasContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactQueryProvider>
      <SaasProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SaasProvider>
    </ReactQueryProvider>
  </StrictMode>,
)
