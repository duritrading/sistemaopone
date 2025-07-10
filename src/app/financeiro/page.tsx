// src/app/financeiro/page.tsx - CORRIGIDO COMPLETAMENTE
'use client'

import { useState, useEffect, useCallback } from 'react'
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
import TransactionActionsDropdown from './components/TransactionActionsDropdown'
import DateFilterDropdown from './components/DateFilterDropdown'
import ViewTransactionModal from './components/ViewTransactionModal'
import SimpleEditModal from './components/SimpleEditModal'
import InfiniteScrollLoader from './components/InfiniteScrollLoader'
import { useTransactionModals } from './hooks/useTransactionModals'

// Constantes
const TRANSACTIONS_PER_PAGE = 20

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
    id: string
    name: string
    type: string
    balance: number
  }
}

interface Account {
  id: string
  name: string
  type: string
  bank?: string
  balance: number
  is_active: boolean
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
  // Estados de paginação (CORRIGIDOS)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(true)

  // Estados principais
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSimpleEditModal, setShowSimpleEditModal] = useState(false)

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

  const handleCloseReceitaModal = () => {
    closeReceitaModal()
    setEditingTransaction(null)
  }

  const handleCloseDespesaModal = () => {
    closeDespesaModal()
    setEditingTransaction(null)
  }

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(1)
    setHasMoreTransactions(true)
    setTransactions([])
    loadTransactions(1, true) // Load first page, reset data
    loadMetrics()
  }, [dateFilter, selectedAccountId, debouncedSearchTerm])

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (err) {
      console.error('Erro ao carregar contas:', err)
    }
  }

  const loadMoreTransactions = async () => {
    if (!hasMoreTransactions || loadingMore) return
    await loadTransactions(currentPage + 1, false)
  }

  const loadTransactions = async (page: number = 1, resetData: boolean = false) => {
    try {
      if (page === 1) setLoading(true)
      if (page > 1) setLoadingMore(true)
      setError(null)

      const offset = (page - 1) * TRANSACTIONS_PER_PAGE

      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          account:accounts(id, name, type, balance)
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

      // Apply account filter
      if (selectedAccountId !== 'all') {
        query = query.eq('account_id', selectedAccountId)
      }

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`description.ilike.%${debouncedSearchTerm}%,category.ilike.%${debouncedSearchTerm}%`)
      }

      // Apply pagination
      query = query
        .order('transaction_date', { ascending: false })
        .range(offset, offset + TRANSACTIONS_PER_PAGE - 1)

      const { data, error } = await query

      if (error) throw error

      const newTransactions = data || []
      
      if (resetData || page === 1) {
        setTransactions(newTransactions)
      } else {
        setTransactions(prev => [...prev, ...newTransactions])
      }

      // Check if there are more transactions
      setHasMoreTransactions(newTransactions.length === TRANSACTIONS_PER_PAGE)
      setCurrentPage(page)

    } catch (err: any) {
      console.error('Erro ao carregar transações:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMetrics = async () => {
    try {
      let query = supabase.from('financial_transactions').select('*')

      // Apply same filters as transactions
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

      // Apply account filter
      if (selectedAccountId !== 'all') {
        query = query.eq('account_id', selectedAccountId)
      }

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`description.ilike.%${debouncedSearchTerm}%,category.ilike.%${debouncedSearchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      const receitasEmAberto = data?.filter(t => t.type === 'receita' && t.status === 'pendente').reduce((sum, t) => sum + t.amount, 0) || 0
      const receitasRealizadas = data?.filter(t => t.type === 'receita' && ['recebido', 'pago'].includes(t.status)).reduce((sum, t) => sum + t.amount, 0) || 0
      const despesasEmAberto = data?.filter(t => t.type === 'despesa' && t.status === 'pendente').reduce((sum, t) => sum + t.amount, 0) || 0
      const despesasRealizadas = data?.filter(t => t.type === 'despesa' && ['recebido', 'pago'].includes(t.status)).reduce((sum, t) => sum + t.amount, 0) || 0

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      recebido: 'bg-green-100 text-green-800 border-green-200',
      pago: 'bg-green-100 text-green-800 border-green-200',
      vencido: 'bg-red-100 text-red-800 border-red-200',
      cancelado: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const labels = {
      pendente: 'Pendente',
      recebido: 'Recebido',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const handleTransactionAction = async (transactionId: string, action: 'mark_paid' | 'mark_pending' | 'edit' | 'delete' | 'view' | 'duplicate') => {
    try {
      const transaction = transactions.find(t => t.id === transactionId)
      if (!transaction) return

      switch (action) {
        case 'mark_paid':
          const newStatus = transaction.type === 'receita' ? 'recebido' : 'pago'
          await supabase
            .from('financial_transactions')
            .update({ 
              status: newStatus, 
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', transactionId)
          
          loadTransactions(1, true)
          loadMetrics()
          break

        case 'mark_pending':
          await supabase
            .from('financial_transactions')
            .update({ 
              status: 'pendente', 
              payment_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', transactionId)
          
          loadTransactions(1, true)
          loadMetrics()
          break

        case 'delete':
          if (!confirm('Tem certeza que deseja excluir esta transação?')) return
          await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', transactionId)
          
          loadTransactions(1, true)
          loadMetrics()
          break

        case 'edit':
          setEditingTransaction(transaction)
          setShowSimpleEditModal(true)
          return

        case 'view':
          setViewingTransaction(transaction)
          setShowViewModal(true)
          return

        case 'duplicate':
          const duplicateData = {
            description: `${transaction.description} (Cópia)`,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            account_id: transaction.account_id,
            transaction_date: new Date().toISOString().split('T')[0],
            status: 'pendente',
            notes: transaction.notes || '',
            installments: 1
          }

          const { error: duplicateError } = await supabase
            .from('financial_transactions')
            .insert([duplicateData])

          if (duplicateError) {
            console.error('Erro ao duplicar transação:', duplicateError)
            alert('Erro ao duplicar transação')
            return
          }

          loadTransactions(1, true)
          loadMetrics()
          alert('Transação duplicada com sucesso!')
          break

        default:
          console.error('Ação não reconhecida:', action)
          return
      }
    } catch (err) {
      console.error('Erro na ação:', err)
      alert('Erro ao executar ação: ' + (err as Error).message)
    }
  }

  const handleBulkAction = async (action: 'mark_paid' | 'delete') => {
    if (selectedTransactions.length === 0) {
      alert('Selecione pelo menos uma transação')
      return
    }

    if (!confirm(`Tem certeza que deseja ${action === 'mark_paid' ? 'marcar como pagas' : 'excluir'} ${selectedTransactions.length} transações?`)) {
      return
    }

    try {
      if (action === 'mark_paid') {
        const updates = selectedTransactions.map(async (id) => {
          const transaction = transactions.find(t => t.id === id)
          if (!transaction) return null

          const newStatus = transaction.type === 'receita' ? 'recebido' : 'pago'
          return supabase
            .from('financial_transactions')
            .update({ 
              status: newStatus, 
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        })
        await Promise.all(updates.filter(Boolean))
      } else {
        await supabase
          .from('financial_transactions')
          .delete()
          .in('id', selectedTransactions)
      }

      setSelectedTransactions([])
      loadTransactions(1, true)
      loadMetrics()
    } catch (err) {
      console.error('Erro na ação em massa:', err)
      alert('Erro ao executar ação em massa')
    }
  }

  const toggleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedTransactions(
      selectedTransactions.length === transactions.length 
        ? [] 
        : transactions.map(t => t.id)
    )
  }

  const calculateRunningBalance = (transactionIndex: number): number => {
    let initialBalance = 0
    if (selectedAccountId !== 'all') {
      const account = accounts.find(a => a.id === selectedAccountId)
      initialBalance = account?.balance || 0
    } else {
      initialBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    }

    let runningBalance = initialBalance

    for (let i = transactions.length - 1; i >= transactionIndex; i--) {
      const transaction = transactions[i]
      if (transaction && (transaction.status === 'recebido' || transaction.status === 'pago')) {
        if (transaction.type === 'receita') {
          runningBalance += transaction.amount
        } else {
          runningBalance -= transaction.amount
        }
      }
    }

    return runningBalance
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="max-w-full mx-auto" style={{ maxWidth: '1600px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-full mx-auto space-y-8" style={{ maxWidth: '1600px' }}>
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
              <p className="text-gray-600 mt-1">Controle suas receitas e despesas</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/financeiro/gestao"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestão
              </Link>
              <NovaDropdownButton 
                onTypeSelect={openTypeModal}
                onFornecedorClick={() => setShowFornecedorModal(true)}
                onCentroCustoClick={() => setShowCentroCustoModal(true)}
                onCategoriaClick={() => setShowCategoriaModal(true)}
                onContaClick={() => setShowContaModal(true)}
              />
              <button
                onClick={openTypeModal}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nova Transação
              </button>
            </div>
          </div>
        </div>

        {/* Métricas Financeiras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receitas em Aberto</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.receitasEmAberto)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receitas Realizadas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.receitasRealizadas)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Despesas em Aberto</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.despesasEmAberto)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Despesas Realizadas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.despesasRealizadas)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo do Período</p>
                <p className={`text-2xl font-bold ${metrics.totalPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.totalPeriodo)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as contas</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>

            <DateFilterDropdown
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
            />

            {selectedTransactions.length > 0 && (
              <div className="flex items-center space-x-2 ml-auto">
                <span className="text-sm text-gray-600">
                  {selectedTransactions.length} selecionadas
                </span>
                <button
                  onClick={() => handleBulkAction('mark_paid')}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Marcar como Pagas
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Transações Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Transações Recentes</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Situação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Valor (R$)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Saldo (R$)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id)}
                          onChange={() => toggleSelectTransaction(transaction.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {transaction.category} • {transaction.account?.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(calculateRunningBalance(index))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap relative">
                        <TransactionActionsDropdown
                          transaction={transaction}
                          onMarkAsPaid={() => handleTransactionAction(transaction.id, 'mark_paid')}
                          onMarkAsPending={() => handleTransactionAction(transaction.id, 'mark_pending')}
                          onEdit={() => handleTransactionAction(transaction.id, 'edit')}
                          onDelete={() => handleTransactionAction(transaction.id, 'delete')}
                          onView={() => handleTransactionAction(transaction.id, 'view')}
                          onDuplicate={() => handleTransactionAction(transaction.id, 'duplicate')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
                  <p>Comece criando sua primeira transação financeira.</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {transactions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}
                    {hasMoreTransactions && ' (há mais para carregar)'}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-500">Modo:</label>
                    <button
                      onClick={() => setUseInfiniteScroll(!useInfiniteScroll)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        useInfiniteScroll 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {useInfiniteScroll ? 'Auto' : 'Manual'}
                    </button>
                  </div>
                </div>
                
                {!useInfiniteScroll && hasMoreTransactions && (
                  <button
                    onClick={loadMoreTransactions}
                    disabled={loadingMore}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Carregar mais ({TRANSACTIONS_PER_PAGE})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {useInfiniteScroll && (
            <InfiniteScrollLoader
              hasMore={hasMoreTransactions}
              isLoading={loadingMore}
              onLoadMore={loadMoreTransactions}
              className="border-t border-gray-200"
            />
          )}
        </div>
      </div>

      {/* Modais */}
      <TransactionTypeModal
        isOpen={showTypeModal}
        onClose={closeTypeModal}
        onReceitaSelect={() => {
          closeTypeModal()
          openReceitaModal()
        }}
        onDespesaSelect={() => {
          closeTypeModal()
          openDespesaModal()
        }}
      />

      <NewReceitaModal
        isOpen={showReceitaModal}
        onClose={handleCloseReceitaModal}
        onSuccess={() => {
          loadTransactions(1, true)
          loadMetrics()
          handleCloseReceitaModal()
        }}
      />

      <NewDespesaModal
        isOpen={showDespesaModal}
        onClose={handleCloseDespesaModal}
        onSuccess={() => {
          loadTransactions(1, true)
          loadMetrics()
          handleCloseDespesaModal()
        }}
      />

      <NovoFornecedorModal
        isOpen={showFornecedorModal}
        onClose={() => setShowFornecedorModal(false)}
        onSuccess={() => setShowFornecedorModal(false)}
      />

      <NovoCentroCustoModal
        isOpen={showCentroCustoModal}
        onClose={() => setShowCentroCustoModal(false)}
        onSuccess={() => setShowCentroCustoModal(false)}
      />

      <NovaCategoriaModal
        isOpen={showCategoriaModal}
        onClose={() => setShowCategoriaModal(false)}
        onSuccess={() => setShowCategoriaModal(false)}
      />

      <NovaContaRecebimentoModal
        isOpen={showContaModal}
        onClose={() => setShowContaModal(false)}
        onSuccess={() => {
          setShowContaModal(false)
          loadAccounts()
        }}
      />

      <SimpleEditModal
        isOpen={showSimpleEditModal}
        onClose={() => {
          setShowSimpleEditModal(false)
          setEditingTransaction(null)
        }}
        onSuccess={() => {
          loadTransactions(1, true)
          loadMetrics()
          setShowSimpleEditModal(false)
          setEditingTransaction(null)
        }}
        transaction={editingTransaction}
      />

      <ViewTransactionModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingTransaction(null)
        }}
        transaction={viewingTransaction}
      />
    </div>
  )
}