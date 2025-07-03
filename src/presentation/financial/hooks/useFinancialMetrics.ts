// src/presentation/financial/hooks/useFinancialMetrics.ts
import { useState, useEffect, useMemo, useCallback } from 'react'
import { FinancialMetricsEntity } from '@/domain/financial/entities/FinancialMetrics'
import { GetFinancialMetricsUseCase } from '@/domain/financial/use-cases/GetFinancialMetricsUseCase'
import { Logger } from '@/shared/utils/logger'

interface UseFinancialMetricsProps {
  year?: number
  month?: number
  startDate?: Date
  endDate?: Date
  realTime?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseFinancialMetricsReturn {
  metrics: FinancialMetricsEntity | null
  insights: {
    cashFlowHealth: 'healthy' | 'warning' | 'critical'
    growthTrend: 'up' | 'down' | 'stable'
    pendingReceitasPercentage: number
    pendingDespesasPercentage: number
    netProfit: number
    recommendations: string[]
  } | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
}

export function useFinancialMetrics({
  year = new Date().getFullYear(),
  month,
  startDate,
  endDate,
  realTime = false,
  autoRefresh = true,
  refreshInterval = 60000
}: UseFinancialMetricsProps = {}): UseFinancialMetricsReturn {
  const [metrics, setMetrics] = useState<FinancialMetricsEntity | null>(null)
  const [insights, setInsights] = useState<UseFinancialMetricsReturn['insights']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const getMetricsUseCase = useMemo(() => new GetFinancialMetricsUseCase(
    // TODO: Inject dependencies
    {} as any,
    new Logger()
  ), [])

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getMetricsUseCase.execute({
        year,
        month,
        startDate,
        endDate,
        realTime
      })

      setMetrics(response.metrics)
      setInsights(response.insights)
      setLastUpdated(new Date())

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas')
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [year, month, startDate, endDate, realTime, getMetricsUseCase])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchMetrics()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchMetrics])

  // Fetch on mount and dependency changes
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const refresh = useCallback(async () => {
    await fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    insights,
    loading,
    error,
    refresh,
    lastUpdated
  }
}
