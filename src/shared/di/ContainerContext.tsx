'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface ContainerContextType {
  supabase: any
  // Adicione outros tipos conforme necessário
}

const ContainerContext = createContext<ContainerContextType | null>(null)

interface ContainerProviderProps {
  container: ContainerContextType
  children: ReactNode
}

export function ContainerProvider({ container, children }: ContainerProviderProps) {
  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  )
}

export function useContainer(): ContainerContextType {
  const container = useContext(ContainerContext)
  
  if (!container) {
    throw new Error('useContainer must be used within a ContainerProvider')
  }
  
  return container
}