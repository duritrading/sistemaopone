'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle,
  Plus, Settings, Download, X, Eye
} from 'lucide-react'
// Removido recharts - versão sem gráficos
import { useToast } from './Toast'
import { Transaction, Account } from '../types/financial'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CashFlowProjection {
  date: string
  projected_income: number
  projected_expenses: number
  projected_balance: number
  confirmed_income: number
  confirmed_expenses: number
  confirmed_balance: number
  net_flow: number
  accumulated_balance: number
}

interface RecurringTransaction {
  id: string
  description: string
  amount: number
  type: 'receita' | 'despesa'
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'yearly'
  start_date: string
  end_date?: string
  category: string
  account_id: string
  is_active: boolean
}

interface CashFlowProjectionProps {
  accounts: Account[]
  onClose: () => void
}

export function CashFlowProjection({ accounts, onClose }: CashFlowProjectionProps) {
  const [projections, setProjections] = useState<CashFlowProjection[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [projectionPeriod, setProjectionPeriod] = useState(6) // months
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [selectedAccount, projectionPeriod])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadRecurringTransactions(),
        generateProjections()
      ])
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar dados do fluxo de caixa'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRecurringTransactions = async () => {
    try {
      let query = supabase
        .from('recurring_transactions')
        .select('*')
        .eq('is_active', true)

      if (selectedAccount !== 'all') {
        query = query.eq('account_id', selectedAccount)
      }

      const { data, error } = await query

      if (error) throw error

      setRecurringTransactions(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar transações recorrentes:', err)
    }
  }

  const generateProjections = async () => {
    try {
      // Load existing transactions for baseline
      const { data: existingTransactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', new Date().toISOString().split('T')[0])
        .order('transaction_date')

      if (error) throw error

      const startDate = new Date()
      const projections: CashFlowProjection[] = []

      // Generate monthly projections
      for (let i = 0; i < projectionPeriod; i++) {
        const projectionDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
        const nextMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1)
        
        // Filter existing transactions for this month
        const monthTransactions = existingTransactions?.filter(t => {
          const txDate = new Date(t.transaction_date)
          return txDate >= projectionDate && txDate < nextMonthDate
        }) || []

        // Calculate confirmed amounts
        const confirmedIncome = monthTransactions
          .filter(t => t.type === 'receita' && ['recebido'].includes(t.status))
          .reduce((sum, t) => sum + t.amount, 0)

        const confirmedExpenses = monthTransactions
          .filter(t => t.type === 'despesa' && ['pago'].includes(t.status))
          .reduce((sum, t) => sum + t.amount, 0)

        const pendingIncome = monthTransactions
          .filter(t => t.type === 'receita' && t.status === 'pendente')
          .reduce((sum, t) => sum + t.amount, 0)

        const pendingExpenses = monthTransactions
          .filter(t => t.type === 'despesa' && t.status === 'pendente')
          .reduce((sum, t) => sum + t.amount, 0)

        // Calculate recurring transactions for this month
        const recurringIncome = calculateRecurringAmount(projectionDate, 'receita')
        const recurringExpenses = calculateRecurringAmount(projectionDate, 'despesa')

        // Project totals
        const projectedIncome = pendingIncome + recurringIncome
        const projectedExpenses = pendingExpenses + recurringExpenses

        const netFlow = (confirmedIncome + projectedIncome) - (confirmedExpenses + projectedExpenses)
        
        const projection: CashFlowProjection = {
          date: projectionDate.toISOString().split('T')[0],
          projected_income: projectedIncome,
          projected_expenses: projectedExpenses,
          projected_balance: projectedIncome - projectedExpenses,
          confirmed_income: confirmedIncome,
          confirmed_expenses: confirmedExpenses,
          confirmed_balance: confirmedIncome - confirmedExpenses,
          net_flow: netFlow,
          accumulated_balance: 0 // Will be calculated below
        }

        projections.push(projection)
      }

      // Calculate accumulated balance
      let runningBalance = await getCurrentBalance()
      
      projections.forEach((projection, index) => {
        runningBalance += projection.net_flow
        projection.accumulated_balance = runningBalance
      })

      setProjections(projections)
    } catch (err: any) {
      console.error('Erro ao gerar projeções:', err)
    }
  }

  const calculateRecurringAmount = (date: Date, type: 'receita' | 'despesa'): number => {
    return recurringTransactions
      .filter(rt => rt.type === type)
      .reduce((sum, rt) => {
        if (shouldIncludeRecurring(rt, date)) {
          return sum + rt.amount
        }
        return sum
      }, 0)
  }

  const shouldIncludeRecurring = (recurring: RecurringTransaction, date: Date): boolean => {
    const startDate = new Date(recurring.start_date)
    const endDate = recurring.end_date ? new Date(recurring.end_date) : null

    if (date < startDate || (endDate && date > endDate)) {
      return false
    }

    switch (recurring.frequency) {
      case 'monthly':
        return true
      case 'quarterly':
        return (date.getMonth() - startDate.getMonth()) % 3 === 0
      case 'yearly':
        return date.getMonth() === startDate.getMonth()
      case 'weekly':
        // Simplified: assume 4 weeks per month
        return true
      default:
        return false
    }
  }

  const getCurrentBalance = async (): Promise<number> => {
    try {
      if (selectedAccount === 'all') {
        const { data, error } = await supabase
          .from('accounts')
          .select('balance')
          .eq('is_active', true)

        if (error) throw error

        return data?.reduce((sum, account) => sum + account.balance, 0) || 0
      } else {
        const { data, error } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', selectedAccount)
          .single()

        if (error) throw error

        return data?.balance || 0
      }
    } catch (err) {
      console.error('Erro ao obter saldo atual:', err)
      return 0
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    })
  }

  const getProjectionStats = useMemo(() => {
    if (projections.length === 0) return null

    const totalProjectedIncome = projections.reduce((sum, p) => sum + p.projected_income, 0)
    const totalProjectedExpenses = projections.reduce((sum, p) => sum + p.projected_expenses, 0)
    const finalBalance = projections[projections.length - 1]?.accumulated_balance || 0
    const currentBalance = projections[0]?.accumulated_balance - projections[0]?.net_flow || 0
    const netChange = finalBalance - currentBalance

    const lowestBalance = Math.min(...projections.map(p => p.accumulated_balance))
    const highestBalance = Math.max(...projections.map(p => p.accumulated_balance))

    return {
      totalProjectedIncome,
      totalProjectedExpenses,
      finalBalance,
      currentBalance,
      netChange,
      lowestBalance,
      highestBalance,
      averageMonthlyFlow: netChange / projections.length
    }
  }, [projections])

  const downloadProjection = () => {
    const csvContent = [
      ['Mês', 'Receitas Projetadas', 'Despesas Projetadas', 'Saldo Projetado', 'Saldo Acumulado'].join(','),
      ...projections.map(p => [
        formatMonth(p.date),
        p.projected_income.toFixed(2),
        p.projected_expenses.toFixed(2),
        p.projected_balance.toFixed(2),
        p.accumulated_balance.toFixed(2)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `projecao_fluxo_caixa_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-6xl w-full mx-4 h-[90vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Gerando projeções...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Fluxo de Caixa Projetado</h2>
              <p className="text-sm text-gray-500">Projeção para os próximos {projectionPeriod} meses</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadProjection}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Baixar projeção"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Todas as contas</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={projectionPeriod}
                onChange={(e) => setProjectionPeriod(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
                <option value={24}>24 meses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats Cards */}
          {getProjectionStats && (
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Saldo Atual</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(getProjectionStats.currentBalance)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Saldo Projetado</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(getProjectionStats.finalBalance)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className={`font-medium ${
                      getProjectionStats.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getProjectionStats.netChange >= 0 ? '+' : ''}
                      {formatCurrency(getProjectionStats?.netChange ?? 0)}
                    </span>
                    <span className="text-gray-500 ml-2">vs atual</span>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Menor Saldo</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {formatCurrency(getProjectionStats.lowestBalance)}
                      </p>
                    </div>
                    {getProjectionStats.lowestBalance < 0 ? (
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-yellow-600" />
                    )}
                  </div>
                  {getProjectionStats.lowestBalance < 0 && (
                    <p className="text-xs text-yellow-700 mt-2">Atenção: saldo negativo previsto</p>
                  )}
                </div>

                <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Fluxo Médio/Mês</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(getProjectionStats.averageMonthlyFlow)}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts - Substituído por estatísticas */}
          <div className="p-6 space-y-6">
            {/* Resumo Visual Simples */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Projeção</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total Receitas Projetadas</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(
                      projections.reduce((sum, p) => sum + p.projected_income, 0)
                    )}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Total Despesas Projetadas</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(
                      projections.reduce((sum, p) => sum + p.projected_expenses, 0)
                    )}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Resultado Líquido</p>
                 <p className={`text-2xl font-bold ${
  (getProjectionStats?.netChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
}`}>
  {formatCurrency(getProjectionStats?.netChange ?? 0)}
</p>
                </div>
              </div>
            </div>

            {/* Evolução Mensal - Tabela Visual */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução do Saldo por Mês</h3>
              <div className="space-y-3">
                {projections.map((projection, index) => (
                  <div key={projection.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formatMonth(projection.date)}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(projection.projected_income)} - {formatCurrency(projection.projected_expenses)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        projection.accumulated_balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(projection.accumulated_balance)}
                      </p>
                      <p className="text-xs text-gray-500">Saldo acumulado</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas e Insights */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights e Alertas</h3>
              <div className="space-y-3">
                {getProjectionStats.lowestBalance < 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Atenção: Saldo negativo previsto</p>
                      <p className="text-xs text-red-600">
                        O menor saldo será de {formatCurrency(getProjectionStats.lowestBalance)}
                      </p>
                    </div>
                  </div>
                )}
                
                {getProjectionStats.netChange > 0 && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Projeção positiva</p>
                      <p className="text-xs text-green-600">
                        Crescimento projetado de {formatCurrency(getProjectionStats?.netChange ?? 0)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Fluxo médio mensal</p>
                    <p className="text-xs text-blue-600">
                      {formatCurrency(getProjectionStats.averageMonthlyFlow)} por mês
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Detalhamento por Mês</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mês
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receitas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Despesas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo Mensal
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo Acumulado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((projection) => (
                      <tr key={projection.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMonth(projection.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                          {formatCurrency(projection.projected_income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                          {formatCurrency(projection.projected_expenses)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          projection.projected_balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(projection.projected_balance)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                          projection.accumulated_balance >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(projection.accumulated_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}