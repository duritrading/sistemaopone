'use client'

import React from 'react'
import { ContainerProvider } from '@/shared/di/ContainerContext'
import { createFinancialContainer } from '@/shared/di/FinancialModuleContainer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
})

const financialContainer = createFinancialContainer()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ContainerProvider container={financialContainer}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </ContainerProvider>
    </QueryClientProvider>
  )
}