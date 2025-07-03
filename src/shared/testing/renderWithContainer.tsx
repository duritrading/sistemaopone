import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ContainerProvider } from '@/shared/di/ContainerContext'
import { createTestContainer } from './TestContainer'

interface CustomRenderOptions extends RenderOptions {
  container?: Container
}

export function renderWithContainer(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { container = createTestContainer(), ...renderOptions } = options

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ContainerProvider container={container}>
        {children}
      </ContainerProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { renderWithContainer as render }