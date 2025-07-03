import { useEffect, useRef } from 'react'
import { performanceMonitor } from '@/shared/utils/performanceMonitor'

export function useComponentPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = performance.now()
  })

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    performanceMonitor.measureComponent(componentName, renderTime)
  })

  return {
    measureOperation: <T>(name: string, fn: () => T) => {
      return performanceMonitor.measureSync(`${componentName}_${name}`, fn)
    }
  }
}