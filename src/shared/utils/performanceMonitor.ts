// src/shared/utils/performanceMonitor.ts
interface PerformanceMetric {
  name: string
  duration: number
  timestamp: string
  metadata?: Record<string, any>
}

interface ComponentMetrics {
  renderCount: number
  avgRenderTime: number
  maxRenderTime: number
  lastRenderTime: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private componentMetrics: Map<string, ComponentMetrics> = new Map()
  private readonly maxMetrics = 1000

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      this.recordMetric(name, duration, metadata)
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, { ...metadata, error: true })
      throw error
    }
  }

  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now()
    
    try {
      const result = fn()
      const duration = performance.now() - startTime
      
      this.recordMetric(name, duration, metadata)
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetric(name, duration, { ...metadata, error: true })
      throw error
    }
  }

  measureComponent(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName) || {
      renderCount: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
      lastRenderTime: 0
    }

    existing.renderCount++
    existing.lastRenderTime = renderTime
    existing.maxRenderTime = Math.max(existing.maxRenderTime, renderTime)
    existing.avgRenderTime = (existing.avgRenderTime * (existing.renderCount - 1) + renderTime) / existing.renderCount

    this.componentMetrics.set(componentName, existing)

    // Log slow renders
    if (renderTime > 100) {
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`)
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getComponentMetrics(): Map<string, ComponentMetrics> {
    return new Map(this.componentMetrics)
  }

  getSlowQueries(threshold = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => 
      m.name.includes('query') && m.duration > threshold
    )
  }

  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      componentMetrics: Object.fromEntries(this.componentMetrics),
      timestamp: new Date().toISOString()
    }, null, 2)
  }

  private recordMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric)
    }
  }

  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    try {
      // Send to analytics service
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Failed to send performance metric:', error)
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
