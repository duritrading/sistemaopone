// src/app/financeiro/page.tsx - VERSÃO PREMIUM COMPLETA
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Plus, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  FileDown, Printer, Upload, X, AlertCircle, DollarSign, Bell,
  Settings, Building2, Paperclip, TrendingUp, Zap
} from 'lucide-react'

// Imports dos componentes base
import { ToastProvider } from './components/Toast'
import { BulkActions } from './components/BulkActions'
import { TransactionDropdown } from './components/TransactionDropdown'
import { useTransactionSelection } from './hooks/useTransactionSelection'
import { useTransactionActions } from './hooks/useTransactionActions'

// Imports dos componentes premium
import { CustomCategoriesManager } from './components/CustomCategoriesManager'
import { AttachmentsModal } from './components/AttachmentsManager'
import { NotificationsManager } from './components/NotificationsManager'
import { BankReconciliation } from './components/BankReconciliation'
import { CashFlowProjection } from './components/CashFlowProjection'

import { Transaction, Account, FinancialMetrics } from './types/financial'

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function FinanceiroPageContent() {
  // Estados principais
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [customCategories, setCustomCategories] = useState<any[]>([])
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    receitas_em_aberto: 0,
    receitas_realizadas: 0,
    despesas_em_aberto: 0,
    despesas_realizadas: 0,
    total_periodo: 0
  })
  
  const [selectedYear, setSelectedYear] = useState(2025)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados dos modais
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Estados dos modais premium
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [showAttachmentsModal, setShowAttachmentsModal] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showReconciliation, setShowReconciliation] = useState<Account | null>(null)
  const [showCashFlowProjection, setShowCashFlowProjection] = useState(false)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    description: '',
    category: 'receitas_servicos',
    type: 'receita' as 'receita' | 'despesa',
    amount: '',
    account_id: '',
    due_date: '',
    company: '',
    notes: ''
  })

  // Hooks customizados para seleção e ações
  const selection = useTransactionSelection(transactions)
  const { loadingState } = useTransactionActions(refreshData)

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    recebido: { label: 'Recebido', color: 'bg-green-100 text-green-800' },
    pago: { label: 'Pago', color: 'bg-blue-100 text-blue-800' },
    vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
    cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
  }

  // Categorias combinadas (padrão + personalizadas)
  const allCategories = {
    receita: {
      'receitas_servicos': 'Receitas de Serviços',
      'receitas_produtos': 'Receitas de Produtos',
      'receitas_outras': 'Outras Receitas',
      ...customCategories
        .filter(c => c.type === 'receita' && c.is_active)
        .reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {})
    },
    despesa: {
      'despesas_operacionais': 'Despesas Operacionais',
      'despesas_administrativas': 'Despesas Administrativas',
      'despesas_pessoal': 'Despesas com Pessoal',
      'despesas_marketing': 'Despesas de Marketing',
      'despesas_tecnologia': 'Despesas de Tecnologia',
      'despesas_outras': 'Outras Despesas',
      ...customCategories
        .filter(c => c.type === 'despesa' && c.is_active)
        .reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {})
    }
  }

  // Função centralizada de refresh
  async function refreshData() {
    await Promise.all([
      fetchTransactions(),
      fetchMetrics(),
      fetchCustomCategories()
    ])
  }

  // Funções de busca de dados
  const fetchTransactions = async () => {
    try {
      setError(null)
      
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          account:accounts(name, type)
        `)
        .order('transaction_date', { ascending: false })

      // Filtro por ano
      if (selectedYear) {
        const startDate = `${selectedYear}-01-01`
        const endDate = `${selectedYear}-12-31`
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
      }

      // Filtro por conta
      if (selectedAccount !== 'all') {
        query = query.eq('account_id', selectedAccount)
      }

      // Filtro por busca
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setTransactions(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar transações:', err)
      setError('Erro ao carregar transações: ' + err.message)
    }
  }

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      setAccounts(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar contas:', err)
      setError('Erro ao carregar contas: ' + err.message)
    }
  }

  const fetchCustomCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      setCustomCategories(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar categorias personalizadas:', err)
    }
  }

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_financial_metrics', { p_year: selectedYear })

      if (error) throw error

      if (data && data.length > 0) {
        const metricsData = data[0]
        setMetrics({
          receitas_em_aberto: Number(metricsData.receitas_em_aberto || 0),
          receitas_realizadas: Number(metricsData.receitas_realizadas || 0),
          despesas_em_aberto: Number(metricsData.despesas_em_aberto || 0),
          despesas_realizadas: Number(metricsData.despesas_realizadas || 0),
          total_periodo: Number(metricsData.total_periodo || 0)
        })
      }
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchCustomCategories(),
        fetchMetrics()
      ])
      setLoading(false)
    }
    
    loadData()
  }, [selectedYear, selectedAccount, searchTerm])

  // Limpar seleção ao mudar filtros
  useEffect(() => {
    selection.clearSelection()
  }, [selectedYear, selectedAccount, searchTerm])

  // Funções de ação
  const handleCreateTransaction = async () => {
    try {
      if (!formData.description.trim()) {
        alert('Descrição é obrigatória')
        return
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        alert('Valor deve ser maior que zero')
        return
      }

      if (!formData.account_id) {
        alert('Conta é obrigatória')
        return
      }

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          description: formData.description.trim(),
          category: formData.category,
          type: formData.type,
          amount: parseFloat(formData.amount),
          account_id: formData.account_id,
          due_date: formData.due_date || null,
          company: formData.company?.trim() || null,
          notes: formData.notes?.trim() || null,
          status: 'pendente'
        }])
        .select()

      if (error) throw error

      // Resetar formulário
      setFormData({
        description: '',
        category: 'receitas_servicos',
        type: 'receita',
        amount: '',
        account_id: '',
        due_date: '',
        company: '',
        notes: ''
      })

      setShowNewTransactionModal(false)
      
      // Recarregar dados
      await refreshData()
      
      alert('Transação criada com sucesso!')
    } catch (err: any) {
      console.error('Erro ao criar transação:', err)
      alert('Erro ao criar transação: ' + err.message)
    }
  }

  // Funções de utility
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleExportCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Empresa', 'Tipo', 'Status', 'Valor']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        formatDate(t.transaction_date),
        `"${t.description}"`,
        `"${t.category}"`,
        `"${t.company || ''}"`,
        t.type,
        t.status,
        t.amount.toFixed(2)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `extrato_financeiro_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setShowExportModal(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Premium da página */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                  <span>Extrato Financeiro</span>
                  <div className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
                    PREMIUM
                  </div>
                </h1>
                <p className="text-blue-100 text-sm">Gestão financeira avançada para sua empresa</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notificações */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 hover:bg-blue-500 rounded-lg transition-colors"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Menu Premium */}
              <div className="flex items-center space-x-2 text-sm">
                <button className="text-blue-100 hover:text-white">Novidades</button>
                <button className="text-blue-100 hover:text-white">Ajuda</button>
                <div className="text-right">
                  <p className="text-xs text-blue-200">OpOne Premium</p>
                  <p className="text-xs text-blue-100">Todas as funcionalidades</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCategoriesManager(true)}
              className="bg-white bg-opacity-10 hover:bg-opacity-20 px-3 py-1 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Categorias</span>
            </button>

            <button
              onClick={() => setShowCashFlowProjection(true)}
              className="bg-white bg-opacity-10 hover:bg-opacity-20 px-3 py-1 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Projeção</span>
            </button>

            <button
              onClick={() => setShowReconciliation(accounts[0] || null)}
              className="bg-white bg-opacity-10 hover:bg-opacity-20 px-3 py-1 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Conciliação</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">Erro</p>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Notificações Widget */}
        {showNotifications && (
          <div className="mb-6">
            <NotificationsManager />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowNewTransactionModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <span>Relatórios</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowExportModal(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar</span>
            </button>

            <button 
              onClick={() => window.print()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Importar planilha</span>
            </button>
          </div>

          <button 
            onClick={() => setShowNewTransactionModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Novo registro</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Period Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center font-medium"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
                <button 
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pesquisar no período selecionado
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta
              </label>
              <select 
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Selecionar todas</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* More Filters */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowAdvancedFilters(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Mais filtros</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button 
              onClick={() => {
                setSearchTerm('')
                setSelectedAccount('all')
              }}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Limpar filtros</span>
            </button>

            {/* Selection shortcuts */}
            {transactions.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Selecionar:</span>
                <button 
                  onClick={() => selection.selectByStatus('pendente')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Pendentes
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => selection.selectByType('receita')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Receitas
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => selection.selectByType('despesa')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Despesas
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Receitas em aberto (R$)</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.receitas_em_aberto)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Receitas realizadas (R$)</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.receitas_realizadas)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Despesas em aberto (R$)</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.despesas_em_aberto)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Despesas realizadas (R$)</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.despesas_realizadas)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total do período (R$)</h3>
            <p className={`text-2xl font-bold ${metrics.total_periodo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.total_periodo)}
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selection.hasSelection && (
          <BulkActions
            selectedTransactions={selection.selectedTransactions}
            selectionStats={selection.selectionStats}
            onClearSelection={selection.clearSelection}
            onRefresh={refreshData}
          />
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando sua primeira transação financeira.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowNewTransactionModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selection.isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = selection.isPartiallySelected
                        }}
                        onChange={selection.toggleAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Situação
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor (R$)
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conta
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anexos
                    </th>
                    <th className="w-16 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selection.isSelected(transaction.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selection.isSelected(transaction.id)}
                          onChange={() => selection.toggleTransaction(transaction.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {allCategories[transaction.type][transaction.category] || transaction.category}
                          </p>
                          {transaction.company && (
                            <p className="text-xs text-gray-400">
                              {transaction.company}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig[transaction.status].color}`}>
                          {statusConfig[transaction.status].label}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${
                        transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {transaction.account?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setShowAttachmentsModal(transaction.id)}
                          className="text-gray-400 hover:text-blue-600 transition-colors relative"
                          title="Ver anexos"
                        >
                          <Paperclip className="w-4 h-4" />
                          {transaction.attachments && transaction.attachments.length > 0 && (
                            <span className="absolute -top-2 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                              {transaction.attachments.length}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <TransactionDropdown 
                          transaction={transaction}
                          onRefresh={refreshData}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NOVA TRANSAÇÃO */}
      {showNewTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Nova Transação</h2>
                  <p className="text-sm text-gray-500">Registre uma nova receita ou despesa</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTransactionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'receita', category: 'receitas_servicos' }))}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      formData.type === 'receita'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Receita</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Dinheiro que entra</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'despesa', category: 'despesas_operacionais' }))}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      formData.type === 'despesa'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Despesa</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Dinheiro que sai</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Pagamento do projeto XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(allCategories[formData.type]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conta *</label>
                  <select 
                    value={formData.account_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 'receita' ? 'Data de Recebimento' : 'Data de Vencimento'}
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa/Cliente</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome da empresa ou cliente"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCreateTransaction}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Criar Transação
              </button>
              <button
                onClick={() => setShowNewTransactionModal(false)}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORTAR */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Exportar Dados</h2>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Exportar {transactions.length} transação(ões) do período selecionado.
              </p>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleExportCSV}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <FileDown className="w-4 h-4" />
                <span>Baixar CSV</span>
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS PREMIUM */}
      {showCategoriesManager && (
        <CustomCategoriesManager
          onClose={() => setShowCategoriesManager(false)}
          onCategoryUpdate={fetchCustomCategories}
        />
      )}

      {showAttachmentsModal && (
        <AttachmentsModal
          transactionId={showAttachmentsModal}
          transactionDescription={
            transactions.find(t => t.id === showAttachmentsModal)?.description || ''
          }
          onClose={() => setShowAttachmentsModal(null)}
        />
      )}

      {showReconciliation && (
        <BankReconciliation
          account={showReconciliation}
          onClose={() => setShowReconciliation(null)}
        />
      )}

      {showCashFlowProjection && (
        <CashFlowProjection
          accounts={accounts}
          onClose={() => setShowCashFlowProjection(false)}
        />
      )}
    </div>
  )
}

// Component principal com Provider
export default function FinanceiroPage() {
  return (
    <ToastProvider>
      <FinanceiroPageContent />
    </ToastProvider>
  )
}