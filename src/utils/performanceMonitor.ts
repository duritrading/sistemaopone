// src/utils/performanceMonitor.ts
/**
 * Sistema de monitoramento de performance para métricas críticas
 * Permite medir o impacto das otimizações implementadas
 */

import React from 'react'

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

interface ComponentMetrics {
  renderCount: number
  lastRenderTime: number
  avgRenderTime: number
  maxRenderTime: number
  minRenderTime: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private componentMetrics: Map<string, ComponentMetrics> = new Map()
  private queryTimes: Map<string, number[]> = new Map()
  private memoryUsage: Array<{ timestamp: number; usage: number }> = []
  
  private readonly MAX_MEMORY_SAMPLES = 100
  private readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second
  
  /**
   * Iniciar medição de performance
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
  }

  /**
   * Finalizar medição de performance
   */
  endMeasure(name: string): number | null {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Metric ${name} not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    // Log de queries lentas
    if (name.includes('query') && duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`Slow query detected: ${name} took ${duration.toFixed(2)}ms`, {
        duration,
        metadata: metric.metadata
      })
    }

    // Armazenar tempos de query para análise
    if (name.includes('query')) {
      const times = this.queryTimes.get(name) || []
      times.push(duration)
      
      // Manter apenas os últimos 50 tempos
      if (times.length > 50) {
        times.shift()
      }
      
      this.queryTimes.set(name, times)
    }

    return duration
  }

  /**
   * Medir execução de função
   */
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name, metadata)
    try {
      const result = await fn()
      this.endMeasure(name)
      return result
    } catch (error) {
      this.endMeasure(name)
      throw error
    }
  }

  /**
   * Medir execução síncrona
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startMeasure(name, metadata)
    try {
      const result = fn()
      this.endMeasure(name)
      return result
    } catch (error) {
      this.endMeasure(name)
      throw error
    }
  }

  /**
   * Registrar métricas de componente
   */
  recordComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName) || {
      renderCount: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity
    }

    existing.renderCount++
    existing.lastRenderTime = renderTime
    existing.maxRenderTime = Math.max(existing.maxRenderTime, renderTime)
    existing.minRenderTime = Math.min(existing.minRenderTime, renderTime)
    
    // Calcular média móvel
    existing.avgRenderTime = ((existing.avgRenderTime * (existing.renderCount - 1)) + renderTime) / existing.renderCount

    this.componentMetrics.set(componentName, existing)

    // Alert para renders lentos
    if (renderTime > 100) {
      console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`)
    }
  }

  /**
   * Monitorar uso de memória
   */
  recordMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      const usage = memInfo.usedJSHeapSize / 1024 / 1024 // MB
      
      this.memoryUsage.push({
        timestamp: Date.now(),
        usage
      })

      // Manter apenas as últimas amostras
      if (this.memoryUsage.length > this.MAX_MEMORY_SAMPLES) {
        this.memoryUsage.shift()
      }

      // Alert para uso alto de memória
      if (usage > 100) { // > 100MB
        console.warn(`High memory usage detected: ${usage.toFixed(2)}MB`)
      }
    }
  }

  /**
   * Obter estatísticas de queries
   */
  getQueryStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    this.queryTimes.forEach((times, queryName) => {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length
      const max = Math.max(...times)
      const min = Math.min(...times)
      const p95 = this.percentile(times, 95)
      
      stats[queryName] = {
        count: times.length,
        avgTime: Math.round(avg),
        maxTime: Math.round(max),
        minTime: Math.round(min),
        p95Time: Math.round(p95),
        slowQueries: times.filter(time => time > this.SLOW_QUERY_THRESHOLD).length
      }
    })
    
    return stats
  }

  /**
   * Obter estatísticas de componentes
   */
  getComponentStats(): Record<string, ComponentMetrics> {
    const stats: Record<string, ComponentMetrics> = {}
    
    this.componentMetrics.forEach((metrics, componentName) => {
      stats[componentName] = {
        ...metrics,
        avgRenderTime: Math.round(metrics.avgRenderTime),
        maxRenderTime: Math.round(metrics.maxRenderTime),
        minRenderTime: Math.round(metrics.minRenderTime)
      }
    })
    
    return stats
  }

  /**
   * Obter estatísticas de memória
   */
  getMemoryStats(): {
    current: number
    avg: number
    max: number
    trend: 'stable' | 'increasing' | 'decreasing'
  } | null {
    if (!this.memoryUsage.length) return null
    
    const current = this.memoryUsage[this.memoryUsage.length - 1].usage
    const avg = this.memoryUsage.reduce((sum, sample) => sum + sample.usage, 0) / this.memoryUsage.length
    const max = Math.max(...this.memoryUsage.map(sample => sample.usage))
    
    // Calcular tendência (últimos 10 vs primeiros 10)
    const recentSamples = this.memoryUsage.slice(-10)
    const oldSamples = this.memoryUsage.slice(0, 10)
    
    const recentAvg = recentSamples.reduce((sum, s) => sum + s.usage, 0) / recentSamples.length
    const oldAvg = oldSamples.reduce((sum, s) => sum + s.usage, 0) / oldSamples.length
    
    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable'
    const diff = recentAvg - oldAvg
    
    if (Math.abs(diff) > 5) { // Diferença > 5MB
      trend = diff > 0 ? 'increasing' : 'decreasing'
    }
    
    return {
      current: Math.round(current),
      avg: Math.round(avg),
      max: Math.round(max),
      trend
    }
  }

  /**
   * Gerar relatório completo de performance
   */
  generateReport(): {
    queries: Record<string, any>
    components: Record<string, ComponentMetrics>
    memory: any
    summary: {
      totalMeasurements: number
      slowQueries: number
      slowComponents: number
      memoryAlerts: number
    }
  } {
    const queryStats = this.getQueryStats()
    const componentStats = this.getComponentStats()
    const memoryStats = this.getMemoryStats()
    
    const slowQueries = Object.values(queryStats).reduce(
      (sum: number, stat: any) => sum + stat.slowQueries, 0
    )
    
    const slowComponents = Object.values(componentStats).filter(
      stat => stat.avgRenderTime > 50
    ).length
    
    const memoryAlerts = this.memoryUsage.filter(
      sample => sample.usage > 100
    ).length
    
    return {
      queries: queryStats,
      components: componentStats,
      memory: memoryStats,
      summary: {
        totalMeasurements: this.metrics.size,
        slowQueries,
        slowComponents,
        memoryAlerts
      }
    }
  }

  /**
   * Exportar dados para análise externa
   */
  exportData(): string {
    const report = this.generateReport()
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      ...report,
      rawMetrics: Object.fromEntries(this.metrics),
      rawMemoryUsage: this.memoryUsage
    }, null, 2)
  }

  /**
   * Limpar dados antigos
   */
  clearOldData(): void {
    // Limpar métricas antigas (mais de 1 hora)
    const oneHourAgo = performance.now() - (60 * 60 * 1000)
    
    this.metrics.forEach((metric, name) => {
      if (metric.startTime < oneHourAgo) {
        this.metrics.delete(name)
      }
    })
    
    // Limpar dados de memória antigos
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    this.memoryUsage = this.memoryUsage.filter(
      sample => sample.timestamp > oneDayAgo
    )
  }

  /**
   * Calcular percentil
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = (p / 100) * (sorted.length - 1)
    
    if (Math.floor(index) === index) {
      return sorted[index]
    }
    
    const lower = sorted[Math.floor(index)]
    const upper = sorted[Math.ceil(index)]
    const weight = index % 1
    
    return lower * (1 - weight) + upper * weight
  }

  /**
   * Configurar coleta automática de métricas
   */
  startAutoCollection(): void {
    // Coletar uso de memória a cada 30 segundos
    setInterval(() => {
      this.recordMemoryUsage()
    }, 30000)
    
    // Limpar dados antigos a cada hora
    setInterval(() => {
      this.clearOldData()
    }, 60 * 60 * 1000)
    
    // Log de estatísticas a cada 5 minutos
    setInterval(() => {
      const report = this.generateReport()
      console.group('📊 Performance Report')
      console.log('Query Stats:', report.queries)
      console.log('Component Stats:', report.components)
      console.log('Memory Stats:', report.memory)
      console.log('Summary:', report.summary)
      console.groupEnd()
    }, 5 * 60 * 1000)
  }
}

// Hook React para monitoramento de componentes
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now()
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTime
    performanceMonitor.recordComponentRender(componentName, renderTime)
  })
  
  return {
    measureAsync: (name: string, fn: () => Promise<any>, metadata?: any) =>
      performanceMonitor.measureAsync(`${componentName}.${name}`, fn, metadata),
    measureSync: (name: string, fn: () => any, metadata?: any) =>
      performanceMonitor.measureSync(`${componentName}.${name}`, fn, metadata)
  }
}

// Hook para monitoramento de queries
export function useQueryMonitor() {
  return {
    measureQuery: async (queryName: string, queryFn: () => Promise<any>, metadata?: any) => {
      return performanceMonitor.measureAsync(`query.${queryName}`, queryFn, metadata)
    }
  }
}

// Instância singleton
export const performanceMonitor = new PerformanceMonitor()

// Auto-iniciar coleta se em produção
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  performanceMonitor.startAutoCollection()
}

export default performanceMonitor