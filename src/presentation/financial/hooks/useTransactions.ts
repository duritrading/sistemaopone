// src/presentation/financial/hooks/useTransactions.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { TransactionEntity } from '@/domain/financial/entities/Transaction'
import { GetTransactionsUseCase } from '@/domain/financial/use-cases/GetTransactionsUseCase'
import { BulkUpdateTransactionsUseCase } from '@/domain/financial/use-cases/BulkUpdateTransactionsUseCase'
import { TransactionFilters } from '@/domain/financial/repositories/ITransactionRepository'
import { Logger } from '@/shared/utils/logger'

interface UseTransactionsProps {
  filters?: TransactionFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

// Custom useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useTransactions({ 
  filters, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: UseTransactionsProps = {}) {
  const [transactions, setTransactions] = useState<TransactionEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Debounce filters to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 300)

  // Dependencies
  const getTransactionsUseCase = useMemo(() => {
    // TODO: Inject dependencies properly
    return {} as any
  }, [])
  
  const logger = useMemo(() => new Logger('useTransactions'), [])

  const bulkUpdateUseCase = useMemo(() => {
    // TODO: Inject dependencies properly
    return {} as any
  }, [])

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getTransactionsUseCase.execute({
        filters: debouncedFilters,
        pagination: { page: 1, limit: 50 }
      })

      setTransactions(result.data)
      setTotalCount(result.total)

      logger.info('Transactions fetched successfully', {
        count: result.data.length,
        total: result.total,
        filters: debouncedFilters
      })

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Error fetching transactions', { error: err })
      setError(errorMessage)
      setTransactions([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedFilters, getTransactionsUseCase, logger])

  // Bulk update transactions
  const bulkUpdate = useCallback(async (
    ids: string[], 
    updates: Record<string, any>
  ) => {
    try {
      setLoading(true)
      
      await bulkUpdateUseCase.execute({
        transactionIds: ids,
        updates
      })

      // Refresh transactions after bulk update
      await fetchTransactions()

      logger.info('Bulk update completed successfully', {
        count: ids.length,
        updates
      })

      return { success: true }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Error in bulk update', { error: err })
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [bulkUpdateUseCase, fetchTransactions, logger])

  // Selection management
  const selectTransaction = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(transactions.map(t => t.id))
  }, [transactions])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchTransactions, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchTransactions])

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Computed values
  const selectedTransactions = useMemo(() => 
    transactions.filter(t => selectedIds.includes(t.id)),
    [transactions, selectedIds]
  )

  const summary = useMemo(() => {
    const receitas = transactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0)

    const despesas = transactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      totalReceitas: receitas,
      totalDespesas: despesas,
      saldo: receitas - despesas,
      totalTransactions: transactions.length
    }
  }, [transactions])

  return {
    // Data
    transactions,
    selectedTransactions,
    totalCount,
    summary,
    
    // State
    loading,
    error,
    selectedIds,
    
    // Actions
    fetchTransactions,
    bulkUpdate,
    selectTransaction,
    selectAll,
    clearSelection,
    
    // Utils
    formatCurrency: (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    },
    
    formatDate: (date: Date) => {
      return date.toLocaleDateString('pt-BR')
    }
  }
}