// src/app/financeiro/page.tsx
'use client'

import React, { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FinancialDashboard } from './components/FinancialDashboard'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function FinanceiroPage() {
  return (
    <ErrorBoundary fallback={<FinancialErrorFallback />}>
      <Suspense fallback={<FinancialLoadingFallback />}>
        <FinancialDashboard />
      </Suspense>
    </ErrorBoundary>
  )
}

function FinancialLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">Carregando módulo financeiro...</p>
      </div>
    </div>
  )
}

function FinancialErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-medium text-red-900 mb-2">Erro no Módulo Financeiro</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <button
            onClick={resetError}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  )
}

// src/app/financeiro/components/FinancialDashboard.tsx
'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Plus, Filter, Download, Search, Bell, Settings } from 'lucide-react'
import { useTransactions } from '@/presentation/financial/hooks/useTransactions'
import { useFinancialMetrics } from '@/presentation/financial/hooks/useFinancialMetrics'
import { useAccounts } from '@/presentation/financial/hooks/useAccounts'
import { TransactionCard } from '@/presentation/financial/components/TransactionCard'
import { MetricCard } from '@/presentation/financial/components/MetricCard'
import { BulkActionBar } from '@/presentation/financial/components/BulkActionBar'
import { FilterPanel } from '@/presentation/financial/components/FilterPanel'
import { TransactionForm } from '@/presentation/financial/components/TransactionForm'
import { TransactionFilters } from '@/domain/financial/repositories/ITransactionRepository'
import { performanceMonitor } from '@/shared/utils/performanceMonitor'

export function FinancialDashboard() {
  // State
  const [filters, setFilters] = useState<TransactionFilters>({
    year: new Date().getFullYear()
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Hooks
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refresh: refreshTransactions,
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    hasSelection,
    selectionStats,
    bulkUpdate,
    bulkUpdateLoading,
    setFilters: setTransactionFilters
  } = useTransactions({ 
    filters: { ...filters, searchTerm },
    autoRefresh: true 
  })

  const {
    metrics,
    insights,
    loading: metricsLoading,
    error: metricsError,
    refresh: refreshMetrics
  } = useFinancialMetrics({ 
    year: filters.year,
    month: filters.month,
    autoRefresh: true 
  })

  const {
    accounts,
    loading: accountsLoading
  } = useAccounts()

  // Handlers
  const handleFilterChange = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters)
    setTransactionFilters(newFilters)
  }, [setTransactionFilters])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([
      refreshTransactions(),
      refreshMetrics()
    ])
  }, [refreshTransactions, refreshMetrics])

  const handleBulkMarkAsPaid = useCallback(async () => {
    if (selectedIds.length === 0) return

    await performanceMonitor.measureAsync('bulk_mark_as_paid', async () => {
      await bulkUpdate(selectedIds, { status: 'pago' })
    })
  }, [selectedIds, bulkUpdate])

  const handleBulkCancel = useCallback(async () => {
    if (selectedIds.length === 0) return

    await performanceMonitor.measureAsync('bulk_cancel', async () => {
      await bulkUpdate(selectedIds, { status: 'cancelado' })
    })
  }, [selectedIds, bulkUpdate])

  const handleExport = useCallback(async () => {
    await performanceMonitor.measureAsync('export_transactions', async () => {
      // TODO: Implement export functionality
      console.log('Exporting transactions...')
    })
  }, [])

  // Memoized components
  const metricsCards = useMemo(() => {
    if (!metrics) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Receitas Realizadas"
          value={metrics.receitasRealizadas}
          formattedValue={metrics.formatCurrency(metrics.receitasRealizadas)}
          trend="up"
          trendValue="+5.2%"
          status="healthy"
          description="Receitas efetivamente recebidas"
        />
        <MetricCard
          title="Despesas Realizadas"
          value={metrics.despesasRealizadas}
          formattedValue={metrics.formatCurrency(metrics.despesasRealizadas)}
          trend="down"
          trendValue="-2.1%"
          status="healthy"
          description="Despesas efetivamente pagas"
        />
        <MetricCard
          title="Lucro Líquido"
          value={metrics.getNetProfit()}
          formattedValue={metrics.formatCurrency(metrics.getNetProfit())}
          trend={metrics.getNetProfit() > 0 ? 'up' : 'down'}
          status={metrics.getNetProfit() > 0 ? 'healthy' : 'critical'}
          description="Receitas - Despesas realizadas"
        />
        <MetricCard
          title="Fluxo de Caixa"
          value={metrics.monthlyCashFlow}
          formattedValue={metrics.formatCurrency(metrics.monthlyCashFlow)}
          trend={insights?.growthTrend}
          status={insights?.cashFlowHealth}
          description="Fluxo de caixa mensal"
        />
      </div>
    )
  }, [metrics, insights])

  const transactionList = useMemo(() => {
    if (transactionsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>
      )
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
          <p className="text-gray-600 mb-4">Comece criando sua primeira transação financeira</p>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Nova Transação
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            isSelected={isSelected(transaction.id)}
            onSelect={toggleSelection}
            onEdit={(t) => {
              // TODO: Open edit modal
              console.log('Edit transaction:', t.id)
            }}
            onViewAttachments={(t) => {
              // TODO: Open attachments modal
              console.log('View attachments:', t.id)
            }}
          />
        ))}
      </div>
    )
  }, [transactions, transactionsLoading, isSelected, toggleSelection])

  const loading = transactionsLoading || metricsLoading || accountsLoading
  const error = transactionsError || metricsError

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
              <p className="text-sm text-gray-600">Gestão financeira completa</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </button>

              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>

              <button
                onClick={() => setShowTransactionForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={handleRefreshAll}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        {metricsCards}

        {/* Insights */}
        {insights && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Insights</h3>
            <div className="space-y-1">
              {insights.recommendations.map((recommendation, index) => (
                <p key={index} className="text-sm text-blue-800">
                  • {recommendation}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            accounts={accounts}
            onFiltersChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {hasSelection && (
          <BulkActionBar
            selectedCount={selectionStats.count}
            totalAmount={selectionStats.totalAmount}
            onMarkAsPaid={handleBulkMarkAsPaid}
            onMarkAsCanceled={handleBulkCancel}
            onUpdateCategory={() => {
              // TODO: Open category update modal
              console.log('Update category for selected transactions')
            }}
            onClearSelection={clearSelection}
            loading={bulkUpdateLoading}
          />
        )}

        {/* Transaction List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Transações</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Selecionar todas
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Limpar seleção
              </button>
            </div>
          </div>

          {transactionList}
        </div>
      </div>

      {/* Modals */}
      {showTransactionForm && (
        <TransactionForm
          accounts={accounts}
          onClose={() => setShowTransactionForm(false)}
          onSuccess={refreshTransactions}
        />
      )}
    </div>
  )
}

// src/app/financeiro/loading.tsx
import React from 'react'

export default function FinanceiroLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
        </div>

        {/* Metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Transactions skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// src/app/financeiro/error.tsx
'use client'

import React from 'react'

export default function FinanceiroError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-red-900 mb-2">Erro no Módulo Financeiro</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <div className="space-y-2">
            <button
              onClick={reset}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}