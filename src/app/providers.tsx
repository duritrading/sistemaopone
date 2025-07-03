'use client'

import React from 'react'
import { ContainerProvider } from '@/shared/di/ContainerContext'
import { createFinancialContainer } from '@/shared/di/FinancialModuleContainer'

const financialContainer = createFinancialContainer()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ContainerProvider container={financialContainer}>
      {children}
    </ContainerProvider>
  )
}
