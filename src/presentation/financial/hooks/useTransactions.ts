import { useState, useEffect, useCallback, useMemo } from 'react'
import { TransactionEntity } from '@/domain/financial/entities/Transaction'
import { GetTransactionsUseCase } from '@/domain/financial/use-cases/GetTransactionsUseCase'
import { BulkUpdateTransactionsUseCase } from '@/domain/financial/use-cases/BulkUpdateTransactionsUseCase'
import { TransactionFilters } from '@/domain/financial/repositories/ITransactionRepository'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { Logger } from '@/shared/utils/logger'

interface UseTransactionsProps {
  filters?: TransactionFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseTransactionsReturn {
  transactions: TransactionEntity[]
  loading: boolean
  error: string | null
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
  page: number
  totalPages: number
  
  // Actions
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  nextPage: () => void
  previousPage: () => void
  setFilters: (filters: TransactionFilters) => void
  
  // Bulk operations
  bulkUpdate: (ids: string[], updates: any) => Promise<boolean>
  bulkUpdateLoading: boolean
  
  // Selection
  selectedIds: string[]
  isSelected: (id: string) => boolean
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  hasSelection: boolean
  
  // Computed values
  selectedTransactions: TransactionEntity[]
  selectionStats: {
    count: number
    totalAmount: number
    revenueCount: number
    expenseCount: number
  }
}

export function useTransactions({ 
  filters = {}, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: UseTransactionsProps = {}): UseTransactionsReturn {
  // State
  const [transactions, setTransactions] = useState<TransactionEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<TransactionFilters>(filters)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false)

  // Debounced search
  const debouncedSearchTerm = useDebounce(currentFilters.searchTerm || '', 500)

  // Dependencies
  const getTransactionsUseCase = useMemo(() => new GetTransactionsUseCase(
    // TODO: Inject dependencies
    {} as any,
    new Logger()
  ), [])

  const bulkUpdateUseCase = useMemo(() => new BulkUpdateTransactionsUseCase(
    // TODO: Inject dependencies
    {} as any,
    {} as any,
    new Logger()
  ), [])

  // Fetch transactions
  const fetchTransactions = useCallback(async (resetPage = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentPage = resetPage ? 1 : page
      
      const response = await getTransactionsUseCase.execute({
        filters: {
          ...currentFilters,
          searchTerm: debouncedSearchTerm
        },
        page: currentPage,
        limit: 50,
        sortBy: 'date',
        sortOrder: 'desc'
      })

      setTransactions(response.transactions)
      setTotalCount(response.totalCount)
      setTotalPages(response.totalPages)
      setHasNext(response.hasNext)
      setHasPrevious(response.hasPrevious)
      
      if (resetPage) {
        setPage(1)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [currentFilters, debouncedSearchTerm, page, getTransactionsUseCase])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchTransactions()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchTransactions])

  // Fetch on mount and dependency changes
  useEffect(() => {
    fetchTransactions(true)
  }, [currentFilters, debouncedSearchTerm])

  // Actions
  const refresh = useCallback(async () => {
    await fetchTransactions(true)
    setSelectedIds([])
  }, [fetchTransactions])

  const loadMore = useCallback(async () => {
    if (hasNext && !loading) {
      setPage(prev => prev + 1)
    }
  }, [hasNext, loading])

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(prev => prev + 1)
    }
  }, [hasNext])

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setPage(prev => prev - 1)
    }
  }, [hasPrevious])

  const setFilters = useCallback((newFilters: TransactionFilters) => {
    setCurrentFilters(newFilters)
    setSelectedIds([])
  }, [])

  // Selection
  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id)
  }, [selectedIds])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(transactions.map(t => t.id))
  }, [transactions])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  // Bulk operations
  const bulkUpdate = useCallback(async (ids: string[], updates: any) => {
    try {
      setBulkUpdateLoading(true)
      
      const response = await bulkUpdateUseCase.execute({
        transactionIds: ids,
        updates
      })

      if (response.success) {
        await refresh()
        return true
      } else {
        setError(response.errors?.join(', ') || 'Erro na atualização em lote')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na atualização em lote')
      return false
    } finally {
      setBulkUpdateLoading(false)
    }
  }, [bulkUpdateUseCase, refresh])

  // Computed values
  const selectedTransactions = useMemo(() => {
    return transactions.filter(t => selectedIds.includes(t.id))
  }, [transactions, selectedIds])

  const selectionStats = useMemo(() => {
    return {
      count: selectedTransactions.length,
      totalAmount: selectedTransactions.reduce((sum, t) => sum + t.amount, 0),
      revenueCount: selectedTransactions.filter(t => t.isRevenue()).length,
      expenseCount: selectedTransactions.filter(t => t.isExpense()).length
    }
  }, [selectedTransactions])

  const hasSelection = selectedIds.length > 0

  return {
    transactions,
    loading,
    error,
    totalCount,
    hasNext,
    hasPrevious,
    page,
    totalPages,
    
    // Actions
    refresh,
    loadMore,
    nextPage,
    previousPage,
    setFilters,
    
    // Bulk operations
    bulkUpdate,
    bulkUpdateLoading,
    
    // Selection
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    hasSelection,
    
    // Computed
    selectedTransactions,
    selectionStats
  }
}