// src/app/financeiro/components/index.tsx
'use client'

import { useState } from 'react'
import { 
  Filter, X, Calendar, Search, Download, Upload, 
  TrendingUp, TrendingDown, DollarSign, CreditCard,
  Eye, EyeOff, ChevronDown, FileText, BarChart3
} from 'lucide-react'
import {
  FinancialMetrics,
  FinancialFilter,
  Account,
  Transaction,
  TransactionType,
  TransactionStatus,
  TRANSACTION_CATEGORIES,
  TRANSACTION_STATUS,
  ACCOUNT_TYPES
} from '@/types/financeiro'

// === CARD DE MÉTRICAS REUTILIZÁVEL ===
interface MetricCardProps {
  title: string
  value: number
  type: 'positive' | 'negative' | 'neutral'
  trend?: {
    value: number
    period: string
    isPositive: boolean
  }
  icon?: React.ReactNode
  subtitle?: string
  loading?: boolean
}

export const MetricCard = ({ 
  title, 
  value, 
  type, 
  trend, 
  icon, 
  subtitle,
  loading = false 
}: MetricCardProps) => {
  const colorClasses = {
    positive: 'text-green-600 bg-green-50 border-green-200',
    negative: 'text-red-600 bg-red-50 border-red-200',
    neutral: 'text-blue-600 bg-blue-50 border-blue-200'
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-6 transition-all hover:shadow-md ${colorClasses[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <div className="text-current">{icon}</div>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <p className={`text-2xl font-bold ${type === 'positive' ? 'text-green-600' : type === 'negative' ? 'text-red-600' : 'text-blue-600'}`}>
            {formatCurrency(value)}
          </p>
          
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
            trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend.value)}% {trend.period}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// === DASHBOARD DE MÉTRICAS ===
interface MetricsDashboardProps {
  metrics: FinancialMetrics
  loading?: boolean
  year: number
}

export const MetricsDashboard = ({ metrics, loading, year }: MetricsDashboardProps) => {
  const [showDetails, setShowDetails] = useState(false)

  const metricsConfig = [
    {
      title: 'Receitas em Aberto',
      value: metrics.receitasEmAberto,
      type: 'positive' as const,
      icon: <DollarSign className="w-4 h-4" />,
      subtitle: 'Aguardando recebimento'
    },
    {
      title: 'Receitas Realizadas',
      value: metrics.receitasRealizadas,
      type: 'positive' as const,
      icon: <TrendingUp className="w-4 h-4" />,
      subtitle: 'Já recebidas'
    },
    {
      title: 'Despesas em Aberto',
      value: metrics.despesasEmAberto,
      type: 'negative' as const,
      icon: <CreditCard className="w-4 h-4" />,
      subtitle: 'Aguardando pagamento'
    },
    {
      title: 'Despesas Realizadas',
      value: metrics.despesasRealizadas,
      type: 'negative' as const,
      icon: <TrendingDown className="w-4 h-4" />,
      subtitle: 'Já pagas'
    },
    {
      title: 'Resultado do Período',
      value: metrics.totalPeriodo,
      type: metrics.totalPeriodo >= 0 ? 'positive' as const : 'negative' as const,
      icon: <BarChart3 className="w-4 h-4" />,
      subtitle: `Ano ${year}`
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Resumo Financeiro</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
        >
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showDetails ? 'Ocultar' : 'Mostrar'} detalhes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {metricsConfig.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            type={metric.type}
            icon={metric.icon}
            subtitle={metric.subtitle}
            loading={loading}
          />
        ))}
      </div>

      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Fluxo de Caixa Previsto</h4>
            <p className={`text-xl font-bold ${
              metrics.fluxoCaixaPrevisto >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.fluxoCaixaPrevisto)}
            </p>
            <p className="text-sm text-gray-500">Considerando todas as pendências</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Saldo Atual</h4>
            <p className={`text-xl font-bold ${
              metrics.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saldoAtual)}
            </p>
            <p className="text-sm text-gray-500">Todas as contas</p>
          </div>
        </div>
      )}
    </div>
  )
}

// === FILTROS AVANÇADOS ===
interface AdvancedFiltersProps {
  isOpen: boolean
  onClose: () => void
  filter: FinancialFilter
  onFilterChange: (filter: Partial<FinancialFilter>) => void
  accounts: Account[]
}

export const AdvancedFilters = ({ 
  isOpen, 
  onClose, 
  filter, 
  onFilterChange, 
  accounts 
}: AdvancedFiltersProps) => {
  if (!isOpen) return null

  const handleStatusChange = (status: TransactionStatus) => {
    const currentStatus = filter.status || []
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status]
    
    onFilterChange({ status: newStatus })
  }

  const handleTypeChange = (type: TransactionType) => {
    const currentTypes = filter.types || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    
    onFilterChange({ types: newTypes })
  }

  const handleAccountChange = (accountId: string) => {
    const currentAccounts = filter.accounts || []
    const newAccounts = currentAccounts.includes(accountId)
      ? currentAccounts.filter(a => a !== accountId)
      : [...currentAccounts, accountId]
    
    onFilterChange({ accounts: newAccounts })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtros Avançados</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Período Específico
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={filter.period?.startDate || ''}
                  onChange={(e) => onFilterChange({
                    period: { ...filter.period, startDate: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                <input
                  type="date"
                  value={filter.period?.endDate || ''}
                  onChange={(e) => onFilterChange({
                    period: { ...filter.period, endDate: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Tipos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipos de Transação
            </label>
            <div className="flex space-x-3">
              {(['receita', 'despesa'] as TransactionType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter.types?.includes(type)
                      ? type === 'receita'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {type === 'receita' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status das Transações
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TRANSACTION_STATUS).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status as TransactionStatus)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    filter.status?.includes(status as TransactionStatus)
                      ? `${config.color} border border-current`
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Contas
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.map(account => (
                <label
                  key={account.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filter.accounts?.includes(account.id) || false}
                    onChange={() => handleAccountChange(account.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{account.name}</p>
                    <p className="text-xs text-gray-500">{ACCOUNT_TYPES[account.type]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Faixa de Valores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Faixa de Valores (R$)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor Mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={filter.amountRange?.min || ''}
                  onChange={(e) => onFilterChange({
                    amountRange: {
                      ...filter.amountRange,
                      min: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor Máximo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Sem limite"
                  value={filter.amountRange?.max || ''}
                  onChange={(e) => onFilterChange({
                    amountRange: {
                      ...filter.amountRange,
                      max: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={() => {
              onFilterChange({
                period: { year: new Date().getFullYear() },
                accounts: [],
                categories: [],
                status: [],
                types: [],
                searchTerm: '',
                amountRange: undefined
              })
            }}
            className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Limpar Tudo
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}

// === COMPONENTE DE EXPORTAÇÃO ===
interface ExportOptionsProps {
  isOpen: boolean
  onClose: () => void
  selectedTransactions: string[]
  allTransactions: Transaction[]
}

export const ExportOptions = ({ 
  isOpen, 
  onClose, 
  selectedTransactions, 
  allTransactions 
}: ExportOptionsProps) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv')
  const [exportScope, setExportScope] = useState<'selected' | 'filtered' | 'all'>('filtered')

  const handleExport = async () => {
    try {
      let dataToExport: Transaction[] = []
      
      switch (exportScope) {
        case 'selected':
          dataToExport = allTransactions.filter(t => selectedTransactions.includes(t.id))
          break
        case 'filtered':
          dataToExport = allTransactions
          break
        case 'all':
          // TODO: Fetch all transactions without filters
          dataToExport = allTransactions
          break
      }

      if (exportFormat === 'csv') {
        downloadCSV(dataToExport)
      } else if (exportFormat === 'xlsx') {
        // TODO: Implement Excel export
        alert('Exportação para Excel será implementada')
      } else if (exportFormat === 'pdf') {
        // TODO: Implement PDF export
        alert('Exportação para PDF será implementada')
      }

      onClose()
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar dados')
    }
  }

  const downloadCSV = (data: Transaction[]) => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Empresa', 'Conta']
    const csvContent = [
      headers.join(','),
      ...data.map(t => [
        t.date,
        `"${t.description}"`,
        t.category,
        t.type,
        t.amount,
        t.status,
        `"${t.company || ''}"`,
        t.account_id
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exportar Dados</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de Exportação
            </label>
            <div className="space-y-2">
              {[
                { value: 'csv', label: 'CSV (Excel)', desc: 'Arquivo de texto separado por vírgulas' },
                { value: 'xlsx', label: 'Excel', desc: 'Planilha do Microsoft Excel' },
                { value: 'pdf', label: 'PDF', desc: 'Documento PDF para impressão' }
              ].map(option => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={exportFormat === option.value}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Escopo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dados para Exportar
            </label>
            <div className="space-y-2">
              {[
                { 
                  value: 'selected', 
                  label: `Selecionadas (${selectedTransactions.length})`, 
                  desc: 'Apenas as transações selecionadas',
                  disabled: selectedTransactions.length === 0
                },
                { 
                  value: 'filtered', 
                  label: `Filtradas (${allTransactions.length})`, 
                  desc: 'Transações visíveis com filtros aplicados' 
                },
                { 
                  value: 'all', 
                  label: 'Todas', 
                  desc: 'Todas as transações do período' 
                }
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    option.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={option.value}
                    checked={exportScope === option.value}
                    onChange={(e) => setExportScope(e.target.value as any)}
                    disabled={option.disabled}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </div>
  )
}