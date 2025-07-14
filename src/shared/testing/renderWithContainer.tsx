// src/shared/testing/renderWithContainer.tsx
import React from 'react'
import { ContainerProvider } from '@/shared/di/ContainerContext'
import { createTestContainer } from './TestContainer'

interface Container {
  // Define basic container interface
  resolve<T>(token: any): T
  register(token: any, implementation: any): void
}

interface CustomRenderOptions {
  container?: Container
}

export function renderWithContainer(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { container: diContainer = createTestContainer(), ...renderOptions } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ContainerProvider container={diContainer as any}>
        {children}
      </ContainerProvider>
    )
  }

  // Return a simple wrapper without testing-library dependency
  return {
    container: diContainer,
    wrapper: Wrapper,
    ui
  }
}

// Simple export without testing-library re-exports
export { renderWithContainer as render }