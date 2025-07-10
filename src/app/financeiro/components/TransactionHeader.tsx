// src/app/financeiro/components/TransactionHeader.tsx
'use client'

import { useState } from 'react'
import { 
  List, 
  Grid, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  BarChart3,
  Calendar,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  type: 'receita' | 'despesa'
  status: string
  transaction_date: string
}

interface TransactionHeaderProps {
  transactions: Transaction[]
  totalCount: number
  onSortChange: (field: string, direction: 'asc' | 'desc') => void
  currentSort: { field: string; direction: 'asc' | 'desc' }
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
}

export default function TransactionHeader({
  transactions,
  totalCount,
  onSortChange,
  currentSort,
  viewMode,
  onViewModeChange
}: TransactionHeaderProps) {
  const [showStats, setShowStats] = useState(false)

  // Calcular estatísticas das transações visíveis
  const stats = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'receita') {
      acc.totalReceitas += transaction.amount
      acc.countReceitas += 1
    } else {
      acc.totalDespesas += transaction.amount
      acc.countDespesas += 1
    }
    return acc
  }, {
    totalReceitas: 0,
    totalDespesas: 0,
    countReceitas: 0,
    countDespesas: 0
  })

  const saldo = stats.totalReceitas - stats.totalDespesas

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    }
    return formatCurrency(value)
  }

  const sortOptions = [
    { value: 'transaction_date', label: 'Data da Transação' },
    { value: 'amount', label: 'Valor' },
    { value: 'description', label: 'Descrição' },
    { value: 'status', label: 'Status' },
    { value: 'created_at', label: 'Data de Criação' }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header Principal */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Título e contador */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transações Recentes</h2>
            <p className="text-gray-600 mt-1">
              {totalCount > 0 
                ? `${transactions.length} de ${totalCount} transação${totalCount !== 1 ? 'ões' : ''}`
                : 'Nenhuma transação encontrada'
              }
            </p>
          </div>

          {/* Controles de visualização e ordenação */}
          <div className="flex items-center space-x-3">
            {/* Estatísticas rápidas */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="hidden sm:inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Estatísticas
            </button>

            {/* Ordenação */}
            <div className="flex items-center space-x-2">
              <select
                value={currentSort.field}
                onChange={(e) => onSortChange(e.target.value, currentSort.direction)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => onSortChange(currentSort.field, currentSort.direction === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={`Ordenar ${currentSort.direction === 'asc' ? 'decrescente' : 'crescente'}`}
              >
                {currentSort.direction === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Modo de visualização */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } transition-colors`}
                title="Visualização em lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } transition-colors`}
                title="Visualização em grid"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas expansíveis */}
      {showStats && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Receitas */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Receitas</p>
                  <p className="text-lg font-bold text-green-600" title={formatCurrency(stats.totalReceitas)}>
                    {formatCompactCurrency(stats.totalReceitas)}
                  </p>
                  <p className="text-xs text-gray-500">{stats.countReceitas} transação{stats.countReceitas !== 1 ? 'ões' : ''}</p>
                </div>
              </div>
            </div>

            {/* Total Despesas */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Despesas</p>
                  <p className="text-lg font-bold text-red-600" title={formatCurrency(stats.totalDespesas)}>
                    {formatCompactCurrency(stats.totalDespesas)}
                  </p>
                  <p className="text-xs text-gray-500">{stats.countDespesas} transação{stats.countDespesas !== 1 ? 'ões' : ''}</p>
                </div>
              </div>
            </div>

            {/* Saldo */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  saldo >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  <DollarSign className={`w-5 h-5 ${
                    saldo >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Saldo</p>
                  <p className={`text-lg font-bold ${
                    saldo >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`} title={formatCurrency(saldo)}>
                    {formatCompactCurrency(saldo)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {saldo >= 0 ? 'Positivo' : 'Negativo'}
                  </p>
                </div>
              </div>
            </div>

            {/* Período */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-purple-600">
                    {transactions.length}
                  </p>
                  <p className="text-xs text-gray-500">Transações</p>
                </div>
              </div>
            </div>
          </div>

          {/* Indicadores rápidos */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {((stats.countReceitas / (stats.countReceitas + stats.countDespesas)) * 100 || 0).toFixed(0)}% Receitas
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {((stats.countDespesas / (stats.countReceitas + stats.countDespesas)) * 100 || 0).toFixed(0)}% Despesas
            </div>
            {saldo >= 0 ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Saldo Positivo
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Saldo Negativo
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estatísticas mobile sempre visíveis */}
      <div className="sm:hidden p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600">Receitas</p>
            <p className="text-sm font-semibold text-green-600">{formatCompactCurrency(stats.totalReceitas)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Despesas</p>
            <p className="text-sm font-semibold text-red-600">{formatCompactCurrency(stats.totalDespesas)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Saldo</p>
            <p className={`text-sm font-semibold ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCompactCurrency(saldo)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}