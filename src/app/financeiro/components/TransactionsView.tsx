'use client'

import { useState, useEffect } from 'react'
import TransactionsList from './TransactionsList'
import TransactionsGrid from './TransactionsGrid'
import TransactionHeader from './TransactionHeader'

// Unified Transaction interface - compatible with both domain and app layers
interface Transaction {
  id: string
  description: string
  amount: number
  type: 'receita' | 'despesa'
  category: string
  status: 'pendente' | 'recebido' | 'pago' | 'vencido' | 'cancelado'
  transaction_date: string
  due_date?: string
  payment_date?: string
  account_id: string
  client_id?: string
  supplier_id?: string
  cost_center?: string
  reference_code?: string
  payment_method?: string
  installments?: number
  notes?: string
  attachments?: string[]
  created_at: string
  updated_at: string
  company?: string
  document?: string
  // Optional account relation for UI purposes
  account?: {
    id: string
    name: string
    type: string
    balance?: number
  }
}

interface TransactionsViewProps {
  transactions: Transaction[]
  totalCount: number
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string) => void
  onMarkPending: (id: string) => void
  onView: (transaction: Transaction) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void
}

export default function TransactionsView({
  transactions,
  totalCount,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkPending,
  onView,
  onLoadMore,
  hasMore = false,
  loading = false,
  onSortChange
}: TransactionsViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [currentSort, setCurrentSort] = useState({ 
    field: 'transaction_date', 
    direction: 'desc' as 'asc' | 'desc' 
  })

  // Save view preference to localStorage
  useEffect(() => {
    const savedViewMode = localStorage?.getItem('financial-view-mode') as 'list' | 'grid' | null
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('financial-view-mode', mode)
    }
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setCurrentSort({ field, direction })
    onSortChange?.(field, direction)
  }

  // Ensure transactions is always an array
  const safeTransactions = Array.isArray(transactions) ? transactions : []

  return (
    <div className="space-y-6">
      {/* Header with controls and statistics */}
      <TransactionHeader
        transactions={safeTransactions}
        totalCount={totalCount}
        onSortChange={handleSortChange}
        currentSort={currentSort}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Transactions content */}
      <div>
        {viewMode === 'list' ? (
          <TransactionsList
            transactions={safeTransactions}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkPaid={onMarkPaid}
            onMarkPending={onMarkPending}
            onView={onView}
            loading={loading}
          />
        ) : (
          <TransactionsGrid
            transactions={safeTransactions}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkPaid={onMarkPaid}
            onMarkPending={onMarkPending}
            onView={onView}
            loading={loading}
          />
        )}
      </div>

      {/* Load More */}
      {hasMore && !loading && onLoadMore && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Carregar mais transações
          </button>
        </div>
      )}

      {/* Loading state for load more */}
      {loading && safeTransactions.length > 0 && (
        <div className="text-center py-6">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Carregando mais transações...</span>
          </div>
        </div>
      )}

      {/* End indicator */}
      {!hasMore && safeTransactions.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            Todas as transações foram carregadas ({totalCount} total)
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && safeTransactions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma transação encontrada
          </h3>
          <p className="text-gray-500">
            Não há transações para exibir com os filtros atuais.
          </p>
        </div>
      )}
    </div>
  )
}