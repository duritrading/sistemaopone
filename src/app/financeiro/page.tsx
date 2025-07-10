// src/app/financeiro/page.tsx - ATUALIZADO
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  Download, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Search,
  Upload,
  Calendar,
  Filter,
  Settings,
  CreditCard,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { NovaDropdownButton } from './components/NovaDropdownButton'
import TransactionTypeModal from './components/TransactionTypeModal'
import NewReceitaModal from './components/NewReceitaModal'
import NewDespesaModal from './components/NewDespesaModal'
import NovoFornecedorModal from './components/NovoFornecedorModal'
import NovoCentroCustoModal from './components/NovoCentroCustoModal'
import NovaCategoriaModal from './components/NovaCategoriaModal'
import NovaContaRecebimentoModal from './components/NovaContaRecebimentoModal'
import { useTransactionModals } from './hooks/useTransactionModals'

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
  created_at: string
  updated_at: string
  account?: {
    name: string
    type: string
  }
}

interface FinancialMetrics {
  receitasEmAberto: number
  receitasRealizadas: number
  despesasEmAberto: number
  despesasRealizadas: number
  totalPeriodo: number
}

interface DateFilter {
  year?: number
  month?: number
  startDate?: string
  endDate?: string
  type: 'year' | 'month' | 'custom'
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    receitasEmAberto: 0,
    receitasRealizadas: 0,
    despesasEmAberto: 0,
    despesasRealizadas: 0,
    totalPeriodo: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'year', year: new Date().getFullYear() })
  
  // Estados dos modais adicionais
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [showCentroCustoModal, setShowCentroCustoModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showContaModal, setShowContaModal] = useState(false)

  const {
    showTypeModal,
    showReceitaModal,
    showDespesaModal,
    openTypeModal,
    closeTypeModal,
    openReceitaModal,
    closeReceitaModal,
    openDespesaModal,
    closeDespesaModal,
    closeAllModals
  } = useTransactionModals()

  useEffect(() => {
    loadTransactions()
    loadMetrics()
  }, [dateFilter])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          account:accounts(name, type)
        `)

      // Apply date filters
      if (dateFilter.type === 'year' && dateFilter.year) {
        query = query
          .gte('transaction_date', `${dateFilter.year}-01-01`)
          .lte('transaction_date', `${dateFilter.year}-12-31`)
      } else if (dateFilter.type === 'month' && dateFilter.year && dateFilter.month) {
        const startDate = `${dateFilter.year}-${dateFilter.month.toString().padStart(2, '0')}-01`
        const endDate = `${dateFilter.year}-${dateFilter.month.toString().padStart(2, '0')}-31`
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
      } else if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
        query = query.gte('transaction_date', dateFilter.startDate).lte('transaction_date', dateFilter.endDate)
      }

      query = query.order('transaction_date', { ascending: false }).limit(100)

      const { data, error } = await query

      if (error) throw error

      setTransactions(data || [])
    } catch (err: any) {
      setError(`Erro ao carregar transações: ${err.message}`)
      console.error('Erro ao carregar transações:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_financial_metrics_2025', { p_year: dateFilter.year || 2025 })

      if (error) throw error

      if (data && data.length > 0) {
        const metricsData = data[0]
        setMetrics({
          receitasEmAberto: metricsData.receitas_em_aberto || 0,
          receitasRealizadas: metricsData.receitas_realizadas || 0,
          despesasEmAberto: metricsData.despesas_em_aberto || 0,
          despesasRealizadas: metricsData.despesas_realizadas || 0,
          totalPeriodo: metricsData.total_periodo || 0
        })
      }
    } catch (err: any) {
      console.error('Erro ao carregar métricas:', err)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-800',
      recebido: 'bg-green-100 text-green-800',
      pago: 'bg-blue-100 text-blue-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-700'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleImportSpreadsheet = () => {
    console.log('Importar planilha')
    // TODO: Implementar import
  }

  const handleExport = () => {
    console.log('Exportar dados')
    // TODO: Implementar export
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Financeiro</h1>
              <p className="text-gray-700 text-lg">
                Gestão financeira completa • {transactions.length} transações registradas
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Link para Gestão */}
              <Link
                href="/financeiro/gestao"
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestão
              </Link>

              <button 
                onClick={handleImportSpreadsheet}
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Planilha
              </button>
              
              <button 
                onClick={handleExport}
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            
            <NovaDropdownButton
  onNovoFornecedor={() => setShowFornecedorModal(true)}
  onNovoCentroCusto={() => setShowCentroCustoModal(true)}
  onNovaCategoria={() => setShowCategoriaModal(true)}
  onNovaContaRecebimento={() => setShowContaModal(true)}
/>
              
              <button 
                onClick={openTypeModal}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Receitas em Aberto */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Receitas em Aberto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.receitasEmAberto)}
                </p>
              </div>
            </div>
          </div>

          {/* Receitas Realizadas */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Receitas Realizadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.receitasRealizadas)}
                </p>
              </div>
            </div>
          </div>

          {/* Despesas em Aberto */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Despesas em Aberto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.despesasEmAberto)}
                </p>
              </div>
            </div>
          </div>

          {/* Despesas Realizadas */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Despesas Realizadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.despesasRealizadas)}
                </p>
              </div>
            </div>
          </div>

          {/* Total do Período */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  metrics.totalPeriodo >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <DollarSign className={`w-6 h-6 ${
                    metrics.totalPeriodo >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Total do Período</p>
                <p className={`text-2xl font-bold ${
                  metrics.totalPeriodo >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(metrics.totalPeriodo)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar transações por descrição, categoria, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Filtro por Conta */}
              <div className="relative min-w-[200px]">
                <select
                  value=""
                  onChange={(e) => {
                    // TODO: Implementar filtro por conta
                    console.log('Filtrar por conta:', e.target.value)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 appearance-none bg-white"
                >
                  <option value="">Todas as contas</option>
                  <option value="conta_corrente">Conta Corrente</option>
                  <option value="conta_poupanca">Conta Poupança</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              {/* Filtros de Data */}
              {/* Filtros de Data */}
              <div className="relative">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateFilter.type === 'year' ? `Ano ${dateFilter.year}` : 
                   dateFilter.type === 'month' ? `${months.find(m => m.value === dateFilter.month)?.label} ${dateFilter.year}` :
                   'Período personalizado'}
                  <Filter className="w-4 h-4 ml-2" />
                </button>

                {showDateFilter && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 text-gray-700 z-10">
                    <div className="p-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Filtro por:</label>
                          <select
                            value={dateFilter.type}
                            onChange={(e) => setDateFilter({ ...dateFilter, type: e.target.value as 'year' | 'month' | 'custom' })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="year">Ano</option>
                            <option value="month">Mês</option>
                            <option value="custom">Período customizado</option>
                          </select>
                        </div>

                        {dateFilter.type === 'year' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ano:</label>
                            <select
                              value={dateFilter.year}
                              onChange={(e) => setDateFilter({ ...dateFilter, year: Number(e.target.value) })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {dateFilter.type === 'month' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Ano:</label>
                              <select
                                value={dateFilter.year}
                                onChange={(e) => setDateFilter({ ...dateFilter, year: Number(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                {years.map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Mês:</label>
                              <select
                                value={dateFilter.month}
                                onChange={(e) => setDateFilter({ ...dateFilter, month: Number(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                {months.map(month => (
                                  <option key={month.value} value={month.value}>{month.label}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}

                        {dateFilter.type === 'custom' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Data inicial:</label>
                              <input
                                type="date"
                                value={dateFilter.startDate}
                                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Data final:</label>
                              <input
                                type="date"
                                value={dateFilter.endDate}
                                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </>
                        )}

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            onClick={() => setShowDateFilter(false)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Transações Recentes</h2>
            <p className="text-gray-700 text-sm mt-1">{filteredTransactions.length} transações encontradas</p>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-700">Carregando transações...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
                <p className="mt-4 text-red-600">{error}</p>
                <button
                  onClick={loadTransactions}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="mx-auto h-8 w-8 text-gray-700" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'Nenhuma transação encontrada' : 'Nenhuma transação cadastrada'}
                </h3>
                <p className="mt-1 text-sm text-gray-700">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca ou filtros' 
                    : 'Comece criando sua primeira transação financeira'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={openTypeModal}
                    className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Transação
                  </button>
                )}
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        transaction.type === 'receita' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'receita' ? 
                          <TrendingUp className="w-6 h-6 text-green-600" /> :
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        }
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-700">{transaction.category}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                          {transaction.account && (
                            <p className="text-sm text-gray-700">{transaction.account.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-700">
                        {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTypeModal && (
        <TransactionTypeModal
          isOpen={showTypeModal}
          onClose={closeTypeModal}
          onSelectReceita={openReceitaModal}
          onSelectDespesa={openDespesaModal}
        />
      )}

      {showReceitaModal && (
        <NewReceitaModal
          isOpen={showReceitaModal}
          onClose={closeReceitaModal}
          onSuccess={() => {
            closeReceitaModal()
            loadTransactions()
            loadMetrics()
          }}
        />
      )}

      {showDespesaModal && (
        <NewDespesaModal
          isOpen={showDespesaModal}
          onClose={closeDespesaModal}
          onSuccess={() => {
            closeDespesaModal()
            loadTransactions()
            loadMetrics()
          }}
        />
      )}

      {showFornecedorModal && (
        <NovoFornecedorModal
          isOpen={showFornecedorModal}
          onClose={() => setShowFornecedorModal(false)}
          onSuccess={() => setShowFornecedorModal(false)}
        />
      )}

      {showCentroCustoModal && (
        <NovoCentroCustoModal
          isOpen={showCentroCustoModal}
          onClose={() => setShowCentroCustoModal(false)}
          onSuccess={() => setShowCentroCustoModal(false)}
        />
      )}

      {showCategoriaModal && (
        <NovaCategoriaModal
          isOpen={showCategoriaModal}
          onClose={() => setShowCategoriaModal(false)}
          onSuccess={() => setShowCategoriaModal(false)}
        />
      )}

      {showContaModal && (
        <NovaContaRecebimentoModal
          isOpen={showContaModal}
          onClose={() => setShowContaModal(false)}
          onSuccess={() => setShowContaModal(false)}
        />
      )}
    </div>
  )
}