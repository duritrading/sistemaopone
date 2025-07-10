// src/app/financeiro/page.tsx - VERSÃO CORRIGIDA - PROBLEMAS DE SINTAXE RESOLVIDOS
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
  Search,
  Settings,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  ArrowUpDown,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import { NovaDropdownButton } from './components/NovaDropdownButton'
import DateFilterDropdown from './components/DateFilterDropdown'

// COMPONENTES MODAIS IMPORTADOS DIRETAMENTE
import TransactionTypeModal from './components/TransactionTypeModal'
import NewReceitaModal from './components/NewReceitaModal'
import NewDespesaModal from './components/NewDespesaModal'
import NovoFornecedorModal from './components/NovoFornecedorModal'
import NovoCentroCustoModal from './components/NovoCentroCustoModal'
import NovaCategoriaModal from './components/NovaCategoriaModal'
import NovaContaRecebimentoModal from './components/NovaContaRecebimentoModal'
import ViewTransactionModal from './components/ViewTransactionModal'

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
  notes?: string
  created_at: string
  updated_at: string
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
}

export default function FinanceiroPage() {
  // ESTADOS BÁSICOS
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [accountsBalance, setAccountsBalance] = useState<{[key: string]: number}>({})
  const [activeActionDropdown, setActiveActionDropdown] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    receitasEmAberto: 0,
    receitasRealizadas: 0,
    despesasEmAberto: 0,
    despesasRealizadas: 0,
    totalPeriodo: 0
  })
  
  // ESTADOS DE CONTROLE
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>({})
  const [accounts, setAccounts] = useState<any[]>([])

  // ESTADOS DOS MODAIS - SEPARADOS E ESPECÍFICOS
  const [showTransactionTypeModal, setShowTransactionTypeModal] = useState(false)
  const [showNewReceitaModal, setShowNewReceitaModal] = useState(false)
  const [showNewDespesaModal, setShowNewDespesaModal] = useState(false)
  const [showEditReceitaModal, setShowEditReceitaModal] = useState(false)
  const [showEditDespesaModal, setShowEditDespesaModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [showCentroCustoModal, setShowCentroCustoModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showContaModal, setShowContaModal] = useState(false)

  // ESTADOS PARA DADOS DOS MODAIS
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null)
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    loadTransactions()
    loadMetrics()
    loadAccounts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeActionDropdown && !(event.target as Element)?.closest('.action-dropdown')) {
        setActiveActionDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeActionDropdown])

  useEffect(() => {
    if (transactions.length > 0) {
      loadTransactions()
    }
  }, [searchTerm, statusFilter, typeFilter, accountFilter, dateFilter])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('financial_transactions')
        .select(`
          id,
          description,
          amount,
          type,
          category,
          status,
          transaction_date,
          due_date,
          payment_date,
          account_id,
          notes,
          created_at,
          updated_at
        `, { count: 'exact' })

      if (searchTerm && searchTerm.trim() !== '') {
        query = query.ilike('description', `%${searchTerm.trim()}%`)
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      if (accountFilter && accountFilter !== 'all') {
        query = query.eq('account_id', accountFilter)
      }

      if (dateFilter.startDate && dateFilter.endDate) {
        query = query
          .gte('transaction_date', dateFilter.startDate)
          .lte('transaction_date', dateFilter.endDate)
      } else if (dateFilter.year && dateFilter.month) {
        const startDate = new Date(dateFilter.year, dateFilter.month - 1, 1).toISOString().split('T')[0]
        const endDate = new Date(dateFilter.year, dateFilter.month, 0).toISOString().split('T')[0]
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
      } else if (dateFilter.year) {
        query = query
          .gte('transaction_date', `${dateFilter.year}-01-01`)
          .lte('transaction_date', `${dateFilter.year}-12-31`)
      }

      query = query
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao carregar transações:', error)
        setError(`Erro ao carregar transações: ${error.message}`)
        throw error
      }

      setTransactions(data || [])
      setTotalCount(count || 0)

    } catch (err: any) {
      console.error('Erro no loadTransactions:', err)
      setError(`Erro: ${err.message}`)
      setTransactions([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const { data: allTransactions, error } = await supabase
        .from('financial_transactions')
        .select('amount, type, status')

      if (error) {
        console.error('Erro ao carregar métricas:', error)
        return
      }

      if (!allTransactions) {
        return
      }

      const receitasEmAberto = allTransactions
        .filter(t => t.type === 'receita' && t.status === 'pendente')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const receitasRealizadas = allTransactions
        .filter(t => t.type === 'receita' && t.status === 'recebido')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const despesasEmAberto = allTransactions
        .filter(t => t.type === 'despesa' && t.status === 'pendente')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const despesasRealizadas = allTransactions
        .filter(t => t.type === 'despesa' && t.status === 'pago')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      setMetrics({
        receitasEmAberto,
        receitasRealizadas,
        despesasEmAberto,
        despesasRealizadas,
        totalPeriodo: receitasRealizadas - despesasRealizadas
      })

    } catch (err) {
      console.error('Erro ao carregar métricas:', err)
    }
  }

  const loadAccounts = async () => {
    try {
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('id, name, type, balance')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.warn('Erro ao carregar contas (tabela pode não existir):', error)
        setAccounts([])
        return
      }

      setAccounts(accountsData || [])

      if (accountsData) {
        const balances: {[key: string]: number} = {}
        
        for (const account of accountsData) {
          balances[account.id] = account.balance || 0
        }
        
        setAccountsBalance(balances)
      }

    } catch (err) {
      console.error('Erro ao carregar contas:', err)
      setAccounts([])
    }
  }

  // FUNÇÃO PARA FECHAR TODOS OS MODAIS
  const closeAllModals = () => {
    setShowTransactionTypeModal(false)
    setShowNewReceitaModal(false)
    setShowNewDespesaModal(false)
    setShowEditReceitaModal(false)
    setShowEditDespesaModal(false)
    setShowViewModal(false)
    setShowFornecedorModal(false)
    setShowCentroCustoModal(false)
    setShowCategoriaModal(false)
    setShowContaModal(false)
    setViewTransaction(null)
    setEditTransaction(null)
    setActiveActionDropdown(null)
  }

  const forceReload = () => {
    setTransactions([])
    setTotalCount(0)
    setError(null)
    loadTransactions()
    loadMetrics()
    loadAccounts()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      recebido: 'bg-green-100 text-green-800',
      pago: 'bg-green-100 text-green-800',
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setAccountFilter('all')
    setDateFilter({})
  }

  const calculateRunningBalance = (currentIndex: number, accountId: string): number => {
    const accountInitialBalance = accountsBalance[accountId] || 0
    
    const accountTransactions = transactions
      .filter(t => t.account_id === accountId)
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
    
    const currentTransaction = transactions[currentIndex]
    const currentTransactionIndex = accountTransactions.findIndex(t => t.id === currentTransaction.id)
    
    if (currentTransactionIndex === -1) return accountInitialBalance
    
    let runningBalance = accountInitialBalance
    
    for (let i = 0; i <= currentTransactionIndex; i++) {
      const transaction = accountTransactions[i]
      
      if (transaction.status === 'recebido' || transaction.status === 'pago') {
        if (transaction.type === 'receita') {
          runningBalance += transaction.amount
        } else {
          runningBalance -= transaction.amount
        }
      }
    }
    
    return runningBalance
  }

  const handleTransactionSuccess = () => {
    loadTransactions()
    loadMetrics()
    loadAccounts()
    closeAllModals()
  }

  const handleMarkAsPaid = async (transactionId: string) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId)
      if (!transaction) return

      const newStatus = transaction.type === 'receita' ? 'recebido' : 'pago'
      
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: newStatus, 
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
      
      if (error) throw error
      
      setActiveActionDropdown(null)
      loadTransactions()
      loadMetrics()
      loadAccounts()
    } catch (err) {
      console.error('Erro ao marcar como pago:', err)
      alert('Erro ao atualizar transação')
    }
  }

  const handleMarkAsPending = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: 'pendente', 
          payment_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
      
      if (error) throw error
      
      setActiveActionDropdown(null)
      loadTransactions()
      loadMetrics()
      loadAccounts()
    } catch (err) {
      console.error('Erro ao marcar como pendente:', err)
      alert('Erro ao atualizar transação')
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return
    
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId)
      
      if (error) throw error
      
      setActiveActionDropdown(null)
      loadTransactions()
      loadMetrics()
      loadAccounts()
    } catch (err) {
      console.error('Erro ao excluir transação:', err)
      alert('Erro ao excluir transação')
    }
  }

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId)
    return account?.name || 'Conta não encontrada'
  }

  // HANDLERS ESPECÍFICOS CORRIGIDOS
  const handleViewDetails = (transaction: Transaction) => {
    console.log('🔍 CORRIGIDO: Abrindo detalhes da transação:', transaction.id)
    setActiveActionDropdown(null)
    setViewTransaction(transaction)
    setShowViewModal(true)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    console.log('✏️ Editando transação:', transaction.id, transaction.type)
    setActiveActionDropdown(null)
    setEditTransaction(transaction)
    
    if (transaction.type === 'receita') {
      setShowEditReceitaModal(true)
    } else {
      setShowEditDespesaModal(true)
    }
  }

  const handleNewTransaction = () => {
    console.log('➕ Nova transação - abrindo modal de tipo')
    closeAllModals()
    setShowTransactionTypeModal(true)
  }

  // CORREÇÃO: Funções corretas para o TransactionTypeModal
  const handleReceitaSelect = () => {
    console.log('💰 CORRIGIDO: Selecionado Nova Receita')
    setShowTransactionTypeModal(false)
    setShowNewReceitaModal(true)
  }

  const handleDespesaSelect = () => {
    console.log('💸 CORRIGIDO: Selecionado Nova Despesa')
    setShowTransactionTypeModal(false)
    setShowNewDespesaModal(true)
  }

  const handleDropdownSelect = (type: string) => {
    console.log('📋 Dropdown selecionado:', type)
    closeAllModals()
    
    switch (type) {
      case 'receita':
        setShowNewReceitaModal(true)
        break
      case 'despesa':
        setShowNewDespesaModal(true)
        break
      case 'fornecedor':
        setShowFornecedorModal(true)
        break
      case 'centro-custo':
        setShowCentroCustoModal(true)
        break
      case 'categoria':
        setShowCategoriaModal(true)
        break
      case 'conta':
        setShowContaModal(true)
        break
      case 'transaction':
        setShowTransactionTypeModal(true)
        break
    }
  }

  // RETURN CORRIGIDO - PROBLEMA DE SINTAXE RESOLVIDO
  return (
    <div className="max-w-full px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600 mt-1">Gestão financeira e controle de fluxo de caixa</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={forceReload}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </button>
          
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          
          <Link 
            href="/financeiro/gestao" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Gestão
          </Link>

          <NovaDropdownButton onSelect={handleDropdownSelect} />

          <button
            onClick={handleNewTransaction}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={forceReload}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receitas em Aberto</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.receitasEmAberto)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receitas Realizadas</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.receitasRealizadas)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Despesas em Aberto</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(metrics.despesasEmAberto)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Despesas Realizadas</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(metrics.despesasRealizadas)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                metrics.totalPeriodo >= 0 ? 'bg-blue-500' : 'bg-red-500'
              }`}>
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo do Período</p>
              <p className={`text-xl font-bold ${
                metrics.totalPeriodo >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(metrics.totalPeriodo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="recebido">Recebido</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
            >
              <option value="all">Receitas e Despesas</option>
              <option value="receita">Apenas Receitas</option>
              <option value="despesa">Apenas Despesas</option>
            </select>

            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
            >
              <option value="all">Todas as contas</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            <DateFilterDropdown
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>

          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || accountFilter !== 'all' || Object.keys(dateFilter).length > 0) && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-600">
            <div className="col-span-1">
              <input type="checkbox" className="rounded border-gray-300" />
            </div>
            <div className="col-span-2 flex items-center space-x-1">
              <span>Data</span>
              <ArrowUpDown className="w-3 h-3" />
            </div>
            <div className="col-span-4">Descrição</div>
            <div className="col-span-2">Situação</div>
            <div className="col-span-2">Valor (R$)</div>
            <div className="col-span-1 flex items-center space-x-1">
              <span>Saldo (R$)</span>
              <HelpCircle className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Carregando transações...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={forceReload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || accountFilter !== 'all' || Object.keys(dateFilter).length > 0
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando sua primeira transação.'
                }
              </p>
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || accountFilter !== 'all' || Object.keys(dateFilter).length > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction, index) => (
                <div key={transaction.id} className="grid grid-cols-12 gap-4 items-center py-3 px-2 hover:bg-gray-50 rounded-lg border border-gray-100">
                  <div className="col-span-1">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </div>

                  <div className="col-span-2 text-sm text-gray-900">
                    {formatDate(transaction.transaction_date)}
                  </div>

                  <div className="col-span-4">
                    <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {transaction.category} • {getAccountName(transaction.account_id)}
                    </div>
                  </div>

                  <div className="col-span-2">
                    {getStatusBadge(transaction.status)}
                  </div>

                  <div className="col-span-2">
                    <span className={`font-medium ${
                      transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount).replace('R$', '')}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">
                      {formatCurrency(calculateRunningBalance(index, transaction.account_id)).replace('R$', '')}
                    </span>

                    <div className="relative action-dropdown">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('🔘 Clique no botão de ações para:', transaction.id)
                          setActiveActionDropdown(
                            activeActionDropdown === transaction.id ? null : transaction.id
                          )
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeActionDropdown === transaction.id && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]">
                          <div className="py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('👁️ CORRIGIDO: Clique em Ver detalhes')
                                handleViewDetails(transaction)
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4 mr-3" />
                              Ver detalhes
                            </button>

                            {['pendente', 'vencido'].includes(transaction.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsPaid(transaction.id)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                              >
                                <Check className="w-4 h-4 mr-3" />
                                Marcar como {transaction.type === 'receita' ? 'recebido' : 'pago'}
                              </button>
                            )}

                            {['recebido', 'pago'].includes(transaction.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsPending(transaction.id)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                              >
                                <X className="w-4 h-4 mr-3" />
                                Marcar como pendente
                              </button>
                            )}

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('✏️ Clique em Editar')
                                handleEditTransaction(transaction)
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4 mr-3" />
                              Editar {transaction.type === 'receita' ? 'receita' : 'despesa'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTransaction(transaction.id)
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-3" />
                              Excluir transação
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAIS CORRIGIDOS ==================== */}
      
      {/* TransactionTypeModal com props corretas */}
      {showTransactionTypeModal && (
        <TransactionTypeModal
          isOpen={showTransactionTypeModal}
          onClose={() => setShowTransactionTypeModal(false)}
          onReceitaSelect={handleReceitaSelect}
          onDespesaSelect={handleDespesaSelect}
        />
      )}

      {showNewReceitaModal && (
        <NewReceitaModal
          isOpen={showNewReceitaModal}
          onClose={() => setShowNewReceitaModal(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {showNewDespesaModal && (
        <NewDespesaModal
          isOpen={showNewDespesaModal}
          onClose={() => setShowNewDespesaModal(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {showEditReceitaModal && editTransaction && (
        <NewReceitaModal
          isOpen={showEditReceitaModal}
          onClose={() => {
            setShowEditReceitaModal(false)
            setEditTransaction(null)
          }}
          onSuccess={handleTransactionSuccess}
          editData={editTransaction}
        />
      )}

      {showEditDespesaModal && editTransaction && (
        <NewDespesaModal
          isOpen={showEditDespesaModal}
          onClose={() => {
            setShowEditDespesaModal(false)
            setEditTransaction(null)
          }}
          onSuccess={handleTransactionSuccess}
          editData={editTransaction}
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

      {/* ViewTransactionModal com isOpen prop adicionada */}
      {showViewModal && viewTransaction && (
        <ViewTransactionModal
          isOpen={showViewModal}
          transaction={viewTransaction}
          onClose={() => {
            console.log('❌ CORRIGIDO: Fechando modal de ver detalhes')
            setShowViewModal(false)
            setViewTransaction(null)
          }}
        />
      )}
    </div>
  )
}