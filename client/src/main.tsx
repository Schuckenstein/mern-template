// client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'
import { ErrorBoundary } from 'react-error-boundary'

import App from './App'
import { theme } from '@/theme'
import { ErrorFallback } from '@/components/ErrorBoundary'
import './index.css'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HelmetProvider>
        <ChakraProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
              {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </BrowserRouter>
          </QueryClientProvider>
        </ChakraProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// =============================================