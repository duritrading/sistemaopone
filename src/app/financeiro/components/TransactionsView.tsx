// src/app/financeiro/components/TransactionsView.tsx
'use client'

import { useState, useEffect } from 'react'
import TransactionsList from './TransactionsList'
import TransactionsGrid from './TransactionsGrid'
import TransactionHeader from './TransactionHeader'

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
  company?: string
  notes?: string
  created_at: string
  updated_at: string
  account?: {
    id: string
    name: string
    type: string
    balance: number
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

  // Salvar preferência de visualização no localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('financial-view-mode') as 'list' | 'grid' | null
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode)
    localStorage.setItem('financial-view-mode', mode)
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setCurrentSort({ field, direction })
    if (onSortChange) {
      onSortChange(field, direction)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com controles e estatísticas */}
      <TransactionHeader
        transactions={transactions}
        totalCount={totalCount}
        onSortChange={handleSortChange}
        currentSort={currentSort}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Conteúdo das transações */}
      <div>
        {viewMode === 'list' ? (
          <TransactionsList
            transactions={transactions}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkPaid={onMarkPaid}
            onMarkPending={onMarkPending}
            onView={onView}
            loading={loading}
          />
        ) : (
          <TransactionsGrid
            transactions={transactions}
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

      {/* Loading state para load more */}
      {loading && transactions.length > 0 && (
        <div className="text-center py-6">
          <div className="inline-flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Carregando mais transações...</span>
          </div>
        </div>
      )}

      {/* Indicador de fim */}
      {!hasMore && transactions.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            Todas as transações foram carregadas ({totalCount} total)
          </p>
        </div>
      )}
    </div>
  )
}