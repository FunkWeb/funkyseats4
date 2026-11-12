import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import './styles/index.css'
import { createRoot } from 'react-dom/client'
import App from './App'
import { queryClient } from './api/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
