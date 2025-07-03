// src/app/financeiro/utils/index.ts
import { 
  Transaction, 
  FinancialMetrics, 
  TransactionStatus, 
  TransactionType,
  TRANSACTION_CATEGORIES 
} from '@/types/financeiro'

// === FORMATAÇÃO ===
export const formatCurrency = (value: number, locale = 'pt-BR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export const formatCompactCurrency = (value: number, locale = 'pt-BR'): string => {
  const absValue = Math.abs(value)
  
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  
  return formatCurrency(value, locale)
}

export const formatDate = (date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('pt-BR')
    case 'long':
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'relative':
      return formatRelativeDate(dateObj)
    default:
      return dateObj.toLocaleDateString('pt-BR')
  }
}

export const formatRelativeDate = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Hoje'
  if (diffInDays === 1) return 'Ontem'
  if (diffInDays === -1) return 'Amanhã'
  if (diffInDays > 0 && diffInDays <= 7) return `${diffInDays} dias atrás`
  if (diffInDays < 0 && diffInDays >= -7) return `Em ${Math.abs(diffInDays)} dias`
  
  return formatDate(date, 'short')
}

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`
}

// === CÁLCULOS FINANCEIROS ===
export const calculateMetrics = (transactions: Transaction[], year?: number): FinancialMetrics => {
  let filteredTransactions = transactions
  
  if (year) {
    filteredTransactions = transactions.filter(t => 
      new Date(t.date).getFullYear() === year
    )
  }

  const metrics: FinancialMetrics = {
    receitasEmAberto: 0,
    receitasRealizadas: 0,
    despesasEmAberto: 0,
    despesasRealizadas: 0,
    totalPeriodo: 0,
    fluxoCaixaPrevisto: 0,
    saldoAtual: 0
  }

  filteredTransactions.forEach(transaction => {
    if (transaction.type === 'receita') {
      if (transaction.status === 'recebido') {
        metrics.receitasRealizadas += transaction.amount
      } else {
        metrics.receitasEmAberto += transaction.amount
      }
    } else if (transaction.type === 'despesa') {
      if (transaction.status === 'pago') {
        metrics.despesasRealizadas += transaction.amount
      } else {
        metrics.despesasEmAberto += transaction.amount
      }
    }
  })

  metrics.totalPeriodo = metrics.receitasRealizadas - metrics.despesasRealizadas
  metrics.fluxoCaixaPrevisto = (metrics.receitasRealizadas + metrics.receitasEmAberto) - 
                               (metrics.despesasRealizadas + metrics.despesasEmAberto)
  metrics.saldoAtual = metrics.receitasRealizadas - metrics.despesasRealizadas

  return metrics
}

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const calculateRunningBalance = (transactions: Transaction[]): Transaction[] => {
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let runningBalance = 0
  
  return sortedTransactions.map(transaction => {
    if (transaction.status === 'recebido' || transaction.status === 'pago') {
      if (transaction.type === 'receita') {
        runningBalance += transaction.amount
      } else {
        runningBalance -= transaction.amount
      }
    }
    
    return {
      ...transaction,
      balance: runningBalance
    }
  })
}

// === VALIDAÇÕES ===
export const validateTransaction = (transaction: Partial<Transaction>): string[] => {
  const errors: string[] = []

  if (!transaction.description?.trim()) {
    errors.push('Descrição é obrigatória')
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('Valor deve ser maior que zero')
  }

  if (!transaction.type) {
    errors.push('Tipo é obrigatório')
  }

  if (!transaction.category) {
    errors.push('Categoria é obrigatória')
  }

  if (!transaction.account_id) {
    errors.push('Conta é obrigatória')
  }

  if (transaction.due_date && new Date(transaction.due_date) < new Date('1900-01-01')) {
    errors.push('Data de vencimento inválida')
  }

  return errors
}

export const isTransactionOverdue = (transaction: Transaction): boolean => {
  if (!transaction.due_date || transaction.status === 'pago' || transaction.status === 'recebido') {
    return false
  }
  
  const dueDate = new Date(transaction.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return dueDate < today
}

export const getTransactionHealth = (transaction: Transaction): 'healthy' | 'warning' | 'critical' => {
  if (transaction.status === 'pago' || transaction.status === 'recebido') {
    return 'healthy'
  }
  
  if (!transaction.due_date) {
    return 'warning'
  }
  
  const dueDate = new Date(transaction.due_date)
  const today = new Date()
  const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) return 'critical' // Vencida
  if (diffInDays <= 3) return 'warning' // Vence em até 3 dias
  return 'healthy'
}

// === FILTROS E BUSCA ===
export const filterTransactions = (
  transactions: Transaction[],
  filters: {
    searchTerm?: string
    types?: TransactionType[]
    status?: TransactionStatus[]
    accounts?: string[]
    dateRange?: { start: Date; end: Date }
    amountRange?: { min: number; max: number }
  }
): Transaction[] => {
  return transactions.filter(transaction => {
    // Busca textual
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesSearch = (
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.company?.toLowerCase().includes(searchLower) ||
        TRANSACTION_CATEGORIES[transaction.category].toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }

    // Filtro por tipo
    if (filters.types?.length && !filters.types.includes(transaction.type)) {
      return false
    }

    // Filtro por status
    if (filters.status?.length && !filters.status.includes(transaction.status)) {
      return false
    }

    // Filtro por conta
    if (filters.accounts?.length && !filters.accounts.includes(transaction.account_id)) {
      return false
    }

    // Filtro por data
    if (filters.dateRange) {
      const transactionDate = new Date(transaction.date)
      if (transactionDate < filters.dateRange.start || transactionDate > filters.dateRange.end) {
        return false
      }
    }

    // Filtro por valor
    if (filters.amountRange) {
      if (filters.amountRange.min && transaction.amount < filters.amountRange.min) {
        return false
      }
      if (filters.amountRange.max && transaction.amount > filters.amountRange.max) {
        return false
      }
    }

    return true
  })
}

export const sortTransactions = (
  transactions: Transaction[],
  sortBy: 'date' | 'amount' | 'description' | 'status' = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Transaction[] => {
  return [...transactions].sort((a, b) => {
    let aValue: any = a[sortBy]
    let bValue: any = b[sortBy]

    if (sortBy === 'date') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    } else if (sortBy === 'amount') {
      aValue = Number(aValue)
      bValue = Number(bValue)
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

// === EXPORTAÇÃO ===
export const exportToCSV = (transactions: Transaction[], filename?: string): void => {
  const headers = [
    'Data',
    'Descrição', 
    'Categoria',
    'Tipo',
    'Valor',
    'Status',
    'Empresa',
    'Vencimento',
    'Observações'
  ]

  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      formatDate(t.date),
      `"${t.description.replace(/"/g, '""')}"`,
      `"${TRANSACTION_CATEGORIES[t.category]}"`,
      t.type === 'receita' ? 'Receita' : 'Despesa',
      t.amount.toFixed(2).replace('.', ','),
      t.status,
      `"${(t.company || '').replace(/"/g, '""')}"`,
      t.due_date ? formatDate(t.due_date) : '',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || `transacoes_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToJSON = (transactions: Transaction[], filename?: string): void => {
  const jsonContent = JSON.stringify(transactions, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || `transacoes_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// === ANÁLISES E INSIGHTS ===
export const getFinancialInsights = (transactions: Transaction[]) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Transações do mês atual
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  // Transações do mês anterior
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
  })

  const currentMetrics = calculateMetrics(currentMonthTransactions)
  const lastMetrics = calculateMetrics(lastMonthTransactions)

  // Transações em atraso
  const overdueTransactions = transactions.filter(isTransactionOverdue)

  // Maior receita e despesa do mês
  const currentReceitas = currentMonthTransactions.filter(t => t.type === 'receita')
  const currentDespesas = currentMonthTransactions.filter(t => t.type === 'despesa')

  const biggestRevenue = currentReceitas.reduce((max, t) => 
    t.amount > max.amount ? t : max, currentReceitas[0]
  )

  const biggestExpense = currentDespesas.reduce((max, t) => 
    t.amount > max.amount ? t : max, currentDespesas[0]
  )

  return {
    currentMetrics,
    lastMetrics,
    growth: {
      revenue: calculateGrowthRate(currentMetrics.receitasRealizadas, lastMetrics.receitasRealizadas),
      expenses: calculateGrowthRate(currentMetrics.despesasRealizadas, lastMetrics.despesasRealizadas),
      profit: calculateGrowthRate(currentMetrics.totalPeriodo, lastMetrics.totalPeriodo)
    },
    overdueCount: overdueTransactions.length,
    overdueAmount: overdueTransactions.reduce((sum, t) => sum + t.amount, 0),
    biggestRevenue,
    biggestExpense,
    trends: {
      averageTransactionValue: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
        : 0,
      transactionCount: transactions.length,
      activeAccounts: [...new Set(transactions.map(t => t.account_id))].length
    }
  }
}

// === CACHE E PERFORMANCE ===
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// === HELPERS DE DATA ===
export const getDateRange = (period: 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } => {
  const now = new Date()
  const start = new Date()
  
  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(now.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
  }
  
  return { start, end: now }
}

export const getMonthBounds = (year: number, month: number): { start: Date; end: Date } => {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  
  return { start, end }
}

export const getYearBounds = (year: number): { start: Date; end: Date } => {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59, 999)
  
  return { start, end }
}

// === CONSTANTS ÚTEIS ===
export const CURRENCY_SYMBOL = 'R$'
export const DECIMAL_SEPARATOR = ','
export const THOUSAND_SEPARATOR = '.'
export const DATE_FORMAT = 'DD/MM/YYYY'

export const CHART_COLORS = {
  positive: '#10B981',  // green-500
  negative: '#EF4444',  // red-500
  neutral: '#6B7280',   // gray-500
  primary: '#3B82F6',   // blue-500
  secondary: '#8B5CF6'  // violet-500
}

export const TRANSACTION_ICONS = {
  receita: '💰',
  despesa: '💸',
  pending: '⏳',
  completed: '✅',
  overdue: '⚠️'
}

export default {
  formatCurrency,
  formatDate,
  calculateMetrics,
  validateTransaction,
  filterTransactions,
  exportToCSV,
  getFinancialInsights,
  debounce,
  throttle
}