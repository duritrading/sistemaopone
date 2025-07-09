// src/app/financeiro/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Settings
} from 'lucide-react'
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
  
  // Estados dos modais adicionais - ✅ CORRIGIDO
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

      const { data, error } = await query.order('transaction_date', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar transações:', err)
      setError('Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const currentYear = dateFilter.year || new Date().getFullYear()
      
      const { data, error } = await supabase
        .rpc('get_financial_metrics', { p_year: currentYear })

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

  const handleTransactionCreated = () => {
    loadTransactions()
    loadMetrics()
    closeAllModals()
  }

  const handleModalSuccess = (type: string) => {
    console.log(`${type} criado com sucesso`)
    loadTransactions()
    loadMetrics()
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      recebido: 'bg-green-100 text-green-800',
      pago: 'bg-blue-100 text-blue-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      pendente: 'Pendente',
      recebido: 'Recebido',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Controle suas receitas, despesas e fluxo de caixa</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </button>
          
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          
          {/* ✅ NOVO BOTÃO DE GESTÃO */}
          <Link 
            href="/financeiro/gestao"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Gestão
          </Link>
          
          {/* ✅ DROPDOWN CORRIGIDO */}
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
              <p className="text-sm font-medium text-gray-600">Receitas em Aberto</p>
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
              <p className="text-sm font-medium text-gray-600">Receitas Realizadas</p>
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
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Despesas em Aberto</p>
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
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Despesas Realizadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.despesasRealizadas)}
              </p>
            </div>
          </div>
        </div>

        {/* Resultado do Período */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                metrics.totalPeriodo >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {metrics.totalPeriodo >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resultado do Período</p>
              <p className={`text-2xl font-bold ${
                metrics.totalPeriodo >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(metrics.totalPeriodo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        {/* Header da Lista */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Transações Recentes</h2>
            <div className="flex items-center space-x-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Date Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Filtros de Data
                  <Filter className="w-4 h-4 ml-2" />
                </button>
                
                {/* Date Filter Dropdown */}
                {showDateFilter && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                    <div className="space-y-4">
                      {/* Filter Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Filtro</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setDateFilter({ ...dateFilter, type: 'year' })}
                            className={`px-3 py-2 text-xs rounded-lg ${
                              dateFilter.type === 'year' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Ano
                          </button>
                          <button
                            onClick={() => setDateFilter({ ...dateFilter, type: 'month' })}
                            className={`px-3 py-2 text-xs rounded-lg ${
                              dateFilter.type === 'month' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Mês
                          </button>
                          <button
                            onClick={() => setDateFilter({ ...dateFilter, type: 'custom' })}
                            className={`px-3 py-2 text-xs rounded-lg ${
                              dateFilter.type === 'custom' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Período
                          </button>
                        </div>
                      </div>

                      {/* Year Filter */}
                      {dateFilter.type === 'year' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                          <select
                            value={dateFilter.year || new Date().getFullYear()}
                            onChange={(e) => setDateFilter({ ...dateFilter, year: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Month Filter */}
                      {dateFilter.type === 'month' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                            <select
                              value={dateFilter.year || new Date().getFullYear()}
                              onChange={(e) => setDateFilter({ ...dateFilter, year: parseInt(e.target.value) })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
                            <select
                              value={dateFilter.month || new Date().getMonth() + 1}
                              onChange={(e) => setDateFilter({ ...dateFilter, month: parseInt(e.target.value) })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month}>
                                  {new Date(2023, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Custom Period Filter */}
                      {dateFilter.type === 'custom' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                            <input
                              type="date"
                              value={dateFilter.startDate || ''}
                              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                            <input
                              type="date"
                              value={dateFilter.endDate || ''}
                              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <button
                          onClick={() => setShowDateFilter(false)}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            setShowDateFilter(false)
                            // Filters are applied automatically via useEffect
                          }}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-8 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        {transaction.account && (
                          <div className="text-sm text-gray-500">
                            {transaction.account.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'receita'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${
                        transaction.type === 'receita'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'receita' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-center">
                      <button className="text-blue-600 hover:text-blue-900 p-2">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira transação.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionTypeModal
        isOpen={showTypeModal}
        onClose={closeTypeModal}
        onSelectReceita={openReceitaModal}
        onSelectDespesa={openDespesaModal}
      />

      <NewReceitaModal
        isOpen={showReceitaModal}
        onClose={closeReceitaModal}
        onSuccess={handleTransactionCreated}
      />

      <NewDespesaModal
        isOpen={showDespesaModal}
        onClose={closeDespesaModal}
        onSuccess={handleTransactionCreated}
      />

      {/* ✅ MODAIS CORRIGIDOS */}
      <NovoFornecedorModal
        isOpen={showFornecedorModal}
        onClose={() => setShowFornecedorModal(false)}
        onSuccess={() => {
          handleModalSuccess('Fornecedor')
          setShowFornecedorModal(false)
        }}
      />

      <NovoCentroCustoModal
        isOpen={showCentroCustoModal}
        onClose={() => setShowCentroCustoModal(false)}
        onSuccess={() => {
          handleModalSuccess('Centro de Custo')
          setShowCentroCustoModal(false)
        }}
      />

      <NovaCategoriaModal
        isOpen={showCategoriaModal}
        onClose={() => setShowCategoriaModal(false)}
        onSuccess={() => {
          handleModalSuccess('Categoria')
          setShowCategoriaModal(false)
        }}
      />

      <NovaContaRecebimentoModal
        isOpen={showContaModal}
        onClose={() => setShowContaModal(false)}
        onSuccess={() => {
          handleModalSuccess('Conta de Recebimento')
          setShowContaModal(false)
        }}
      />
    </div>
  )
}