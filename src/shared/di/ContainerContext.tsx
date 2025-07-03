import React, { createContext, useContext, ReactNode } from 'react'
import { Container } from './Container'

const ContainerContext = createContext<Container | null>(null)

interface ContainerProviderProps {
  container: Container
  children: ReactNode
}

export function ContainerProvider({ container, children }: ContainerProviderProps) {
  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  )
}

export function useContainer(): Container {
  const container = useContext(ContainerContext)
  
  if (!container) {
    throw new Error('useContainer must be used within a ContainerProvider')
  }
  
  return container
}

/**
 * Hook para resolver dependências
 */
export function useService<T>(token: string): T {
  const container = useContainer()
  return container.resolve<T>(token)
}