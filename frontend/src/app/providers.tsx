/**
 * Providers wrapper for ClipPilot frontend
 * Sets up TanStack Query and other global providers
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

// Query client configuration
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache time: 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 1 time
        retry: 1,
        // Refetch on window focus
        refetchOnWindowFocus: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
      },
      mutations: {
        // Retry mutations on failure
        retry: 0,
      },
    },
  })
}

interface ProvidersProps {
  children: ReactNode
}

/**
 * Global providers component
 * Wrap your app with this component in layout.tsx
 */
export function Providers({ children }: ProvidersProps) {
  // Create query client per-request (for SSR safety)
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  )
}
