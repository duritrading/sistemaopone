// src/app/financeiro/hooks/useFinanceiro.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { TransactionHandlers, MetricsHandlers, AccountHandlers } from '../handlers/FinanceiroHandlers'
import {
  Transaction,
  Account,
  FinancialMetrics,
  FinancialFilter,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  BulkAction
} from '@/types/financeiro'

interface UseFinanceiroState {
  transactions: Transaction[]
  accounts: Account[]
  metrics: FinancialMetrics
  loading: boolean
  error: string | null
}

interface UseFinanceiroFilter extends Partial<FinancialFilter> {
  selectedTransactions: string[]
}

interface UseFinanceiroActions {
  // Transaction actions
  createTransaction: (formData: CreateTransactionRequest) => Promise<void>
  updateTransaction: (formData: UpdateTransactionRequest) => Promise<void>
  deleteTransaction: (transactionId: string) => Promise<void>
  bulkAction: (action: BulkAction) => Promise<void>
  
  // Selection actions
  selectTransaction: (transactionId: string) => void
  selectAllTransactions: () => void
  clearSelection: () => void
  
  // Filter actions
  updateFilter: (filter: Partial<FinancialFilter>) => void
  clearFilters: () => void
  
  // Data actions
  refreshData: () => Promise<void>
  refreshMetrics: () => Promise<void>
}

interface UseFinanceiroReturn extends UseFinanceiroState, UseFinanceiroActions {
  filteredTransactions: Transaction[]
  selectedTransactions: string[]
  hasSelection: boolean
  isFiltered: boolean
}

const initialState: UseFinanceiroState = {
  transactions: [],
  accounts: [],
  metrics: {
    receitasEmAberto: 0,
    receitasRealizadas: 0,
    despesasEmAberto: 0,
    despesasRealizadas: 0,
    totalPeriodo: 0,
    fluxoCaixaPrevisto: 0,
    saldoAtual: 0
  },
  loading: true,
  error: null
}

const initialFilter: FinancialFilter = {
  period: { year: new Date().getFullYear() },
  accounts: [],
  categories: [],
  status: [],
  types: [],
  searchTerm: ''
}

export const useFinanceiro = (): UseFinanceiroReturn => {
  // === ESTADOS ===
  const [state, setState] = useState<UseFinanceiroState>(initialState)
  const [filter, setFilter] = useState<FinancialFilter>(initialFilter)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])

  // === COMPUTED VALUES ===
  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions]

    // Aplicar filtros locais para performance
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase()
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.company?.toLowerCase().includes(searchLower) ||
        transaction.category.toLowerCase().includes(searchLower)
      )
    }

    if (filter.status.length > 0) {
      filtered = filtered.filter(transaction => 
        filter.status.includes(transaction.status)
      )
    }

    if (filter.types.length > 0) {
      filtered = filtered.filter(transaction => 
        filter.types.includes(transaction.type)
      )
    }

    if (filter.accounts.length > 0) {
      filtered = filtered.filter(transaction => 
        filter.accounts.includes(transaction.account_id)
      )
    }

    return filtered
  }, [state.transactions, filter])

  const hasSelection = selectedTransactions.length > 0
  const isFiltered = !!(
    filter.searchTerm ||
    filter.status.length > 0 ||
    filter.types.length > 0 ||
    filter.accounts.length > 0
  )

  // === DATA FETCHERS ===
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await TransactionHandlers.getAll(filter)
      if (response.error) {
        setState(prev => ({ ...prev, error: response.error }))
        return
      }
      
      setState(prev => ({ 
        ...prev, 
        transactions: response.data,
        error: null 
      }))
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erro inesperado ao carregar transações' 
      }))
    }
  }, [filter])

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await AccountHandlers.getAll()
      if (response.error) {
        setState(prev => ({ ...prev, error: response.error }))
        return
      }
      
      setState(prev => ({ 
        ...prev, 
        accounts: response.data,
        error: null 
      }))
    } catch (error: any) {
      console.error('Erro ao buscar contas:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erro inesperado ao carregar contas' 
      }))
    }
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await MetricsHandlers.getFinancialMetrics(filter)
      if (response.error) {
        setState(prev => ({ ...prev, error: response.error }))
        return
      }
      
      if (response.data) {
        setState(prev => ({ 
          ...prev, 
          metrics: response.data!,
          error: null 
        }))
      }
    } catch (error: any) {
      console.error('Erro ao buscar métricas:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erro inesperado ao carregar métricas' 
      }))
    }
  }, [filter])

  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchMetrics()
      ])
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [fetchTransactions, fetchAccounts, fetchMetrics])

  const refreshMetrics = useCallback(async () => {
    await fetchMetrics()
  }, [fetchMetrics])

  // === TRANSACTION ACTIONS ===
  const createTransaction = useCallback(async (formData: CreateTransactionRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await TransactionHandlers.create(formData)
      if (response.error) {
        setState(prev => ({ ...prev, error: response.error, loading: false }))
        throw new Error(response.error)
      }

      // Refresh data after creation
      await refreshData()
      
      console.log('✅ Transação criada com sucesso')
    } catch (error: any) {
      console.error('Erro ao criar transação:', error)
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }, [refreshData])

  const updateTransaction = useCallback(async (formData: UpdateTransactionRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await TransactionHandlers.update(formData)
      if (response.error) {
        setState(prev => ({ ...prev, error: response.error, loading: false }))
        throw new Error(response.error)
      }

      // Update local state optimistically
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === formData.id ? { ...t, ...response.data! } : t
        ),
        loading: false
      }))

      // Refresh metrics
      await refreshMetrics()
      
      console.log('✅ Transação atualizada com sucesso')
    } catch (error: any) {
      console.error('Erro ao atualizar transação:', error)
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }, [refreshMetrics])

  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await TransactionHandlers.delete(transactionId)
      if (response.error) {
        setState(prev => ({ ...prev, error: response.error, loading: false }))
        throw new Error(response.error)
      }

      // Remove from local state
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== transactionId),
        loading: false
      }))

      // Remove from selection if selected
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId))

      // Refresh metrics
      await refreshMetrics()
      
      console.log('✅ Transação excluída com sucesso')
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error)
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }, [refreshMetrics])

  const bulkAction = useCallback(async (action: BulkAction) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await TransactionHandlers.bulkAction(action)
      if (response.error) {
        setState(prev => ({ ...prev, error: response.error, loading: false }))
        throw new Error(response.error)
      }

      // Clear selection
      setSelectedTransactions([])

      // Refresh data
      await refreshData()
      
      console.log(`✅ Ação em lote "${action.type}" executada com sucesso`)
    } catch (error: any) {
      console.error('Erro na ação em lote:', error)
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }, [refreshData])

  // === SELECTION ACTIONS ===
  const selectTransaction = useCallback((transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }, [])

  const selectAllTransactions = useCallback(() => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id))
    }
  }, [selectedTransactions.length, filteredTransactions])

  const clearSelection = useCallback(() => {
    setSelectedTransactions([])
  }, [])

  // === FILTER ACTIONS ===
  const updateFilter = useCallback((newFilter: Partial<FinancialFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
    setSelectedTransactions([]) // Clear selection when filter changes
  }, [])

  const clearFilters = useCallback(() => {
    setFilter(initialFilter)
    setSelectedTransactions([])
  }, [])

  // === EFFECTS ===
  useEffect(() => {
    refreshData()
  }, [filter.period, filter.accounts]) // Only refresh on major filter changes

  useEffect(() => {
    // Debounced search
    if (filter.searchTerm) {
      const timeoutId = setTimeout(() => {
        fetchTransactions()
      }, 300)
      
      return () => clearTimeout(timeoutId)
    }
  }, [filter.searchTerm, fetchTransactions])

  // === RETURN ===
  return {
    // State
    transactions: state.transactions,
    accounts: state.accounts,
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,
    
    // Computed
    filteredTransactions,
    selectedTransactions,
    hasSelection,
    isFiltered,
    
    // Transaction actions
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkAction,
    
    // Selection actions
    selectTransaction,
    selectAllTransactions,
    clearSelection,
    
    // Filter actions
    updateFilter,
    clearFilters,
    
    // Data actions
    refreshData,
    refreshMetrics
  }
}

// === HOOK PARA MÉTRICAS ESPECÍFICAS ===
export const useFinanceiroMetrics = (year?: number) => {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await MetricsHandlers.getFinancialMetrics({
        period: { year: year || new Date().getFullYear() }
      })
      
      if (response.error) {
        setError(response.error)
        return
      }
      
      setMetrics(response.data)
    } catch (err: any) {
      setError('Erro inesperado ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics
  }
}

// === HOOK PARA CONTAS ===
export const useFinanceiroAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await AccountHandlers.getAll()
      
      if (response.error) {
        setError(response.error)
        return
      }
      
      setAccounts(response.data)
    } catch (err: any) {
      setError('Erro inesperado ao carregar contas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    accounts,
    loading,
    error,
    refresh: fetchAccounts
  }
}