// src/presentation/financial/hooks/useFinancialMetrics.ts
import { useState, useEffect, useMemo } from 'react'

interface UseFinancialMetricsProps {
  year?: number
  month?: number
  startDate?: Date
  endDate?: Date
  realTime?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface FinancialMetricsEntity {
  totalReceitas: number
  totalDespesas: number
  receitasRealizadas: number
  despesasRealizadas: number
  saldoPeriodo: number
  [key: string]: any
}

interface UseFinancialMetricsReturn {
  metrics: FinancialMetricsEntity | null
  insights: any
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  fetchMetrics: () => Promise<void>
  refreshMetrics: () => Promise<void>
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

  const getMetricsUseCase = useMemo(() => {
    // Mock implementation for now
    return {
      execute: async (params: any) => {
        // TODO: Implement real metrics calculation
        return {
          data: {
            totalReceitas: 0,
            totalDespesas: 0,
            receitasRealizadas: 0,
            despesasRealizadas: 0,
            saldoPeriodo: 0
          },
          insights: null
        }
      }
    }
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getMetricsUseCase.execute({
        year,
        month,
        startDate,
        endDate
      })

      setMetrics(result.data)
      setInsights(result.insights)
      setLastUpdated(new Date())

      console.log('Financial metrics fetched successfully', {
        year,
        month,
        metrics: result.data
      })

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error fetching financial metrics', { error: err })
      setError(errorMessage)
      setMetrics(null)
      setInsights(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshMetrics = async () => {
    await fetchMetrics()
  }

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Initial fetch and refetch when parameters change
  useEffect(() => {
    fetchMetrics()
  }, [year, month, startDate, endDate])

  return {
    metrics,
    insights,
    loading,
    error,
    lastUpdated,
    fetchMetrics,
    refreshMetrics
  }
}