// src/app/financeiro/page.tsx - VERSÃO COMPLETA COM MENUS REORGANIZADOS
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Plus, Search, ChevronDown, ChevronLeft, ChevronRight,
  FileDown, Printer, Upload, X, AlertCircle, DollarSign, Bell,
  Settings, Building2, Paperclip, TrendingUp, Zap, Calendar,
  Check, MoreHorizontal, Edit2, Trash2, CreditCard, Wallet
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

// Hook para debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Componente para Gerenciar Contas
function AccountsManager({ 
  accounts, 
  onClose, 
  onAccountUpdate 
}: { 
  accounts: Account[]
  onClose: () => void
  onAccountUpdate: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'conta_corrente',
    bank: '',
    balance: ''
  })
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)

  const accountTypes = [
    { value: 'conta_corrente', label: 'Conta Corrente' },
    { value: 'conta_poupanca', label: 'Conta Poupança' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'investimento', label: 'Investimento' },
    { value: 'outros', label: 'Outros' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Nome da conta é obrigatório')
      return
    }

    setLoading(true)
    try {
      if (editingAccount) {
        // Atualizar conta existente
        const { error } = await supabase
          .from('accounts')
          .update({
            name: formData.name.trim(),
            type: formData.type,
            bank: formData.bank.trim() || null,
            balance: parseFloat(formData.balance) || 0
          })
          .eq('id', editingAccount.id)

        if (error) throw error
        alert('Conta atualizada com sucesso!')
      } else {
        // Criar nova conta
        const { error } = await supabase
          .from('accounts')
          .insert({
            name: formData.name.trim(),
            type: formData.type,
            bank: formData.bank.trim() || null,
            balance: parseFloat(formData.balance) || 0,
            is_active: true
          })

        if (error) throw error
        alert('Conta criada com sucesso!')
      }

      // Reset form
      setFormData({ name: '', type: 'conta_corrente', bank: '', balance: '' })
      setEditingAccount(null)
      onAccountUpdate()
    } catch (err: any) {
      console.error('Erro ao salvar conta:', err)
      alert('Erro ao salvar conta: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      bank: account.bank || '',
      balance: account.balance.toString()
    })
  }

  const handleDelete = async (accountId: string, accountName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a conta "${accountName}"?`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', accountId)

      if (error) throw error
      
      alert('Conta excluída com sucesso!')
      onAccountUpdate()
    } catch (err: any) {
      console.error('Erro ao excluir conta:', err)
      alert('Erro ao excluir conta: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingAccount(null)
    setFormData({ name: '', type: 'conta_corrente', bank: '', balance: '' })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gerenciar Contas</h2>
              <p className="text-sm text-gray-600">Adicione, edite ou remova contas bancárias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Formulário */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: Conta Corrente Principal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Conta *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.bank}
                  onChange={(e) => setFormData({...formData, bank: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: Itaú, Bradesco, Nubank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-600">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3">
                {editingAccount && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editingAccount ? 'Atualizar' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Contas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contas Existentes</h3>
            
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma conta cadastrada
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map(account => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {account.type === 'cartao_credito' || account.type === 'cartao_debito' ? (
                          <CreditCard className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Wallet className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{account.name}</h4>
                        <div className="text-sm text-gray-600">
                          <span className="capitalize">
                            {accountTypes.find(t => t.value === account.type)?.label || account.type}
                          </span>
                          {account.bank && ` • ${account.bank}`}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Saldo: R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded"
                        title="Editar conta"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id, account.name)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded"
                        title="Excluir conta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  
  // Estados de filtros
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [dateFilterType, setDateFilterType] = useState<'year' | 'month' | 'custom'>('year')
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados dos dropdowns
  const [showNewDropdown, setShowNewDropdown] = useState(false)
  const [showReportsDropdown, setShowReportsDropdown] = useState(false)
  const [showAccountSelector, setShowAccountSelector] = useState(false)
  
  // Estados dos modais
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [showAccountsManager, setShowAccountsManager] = useState(false)
  const [showAttachmentsModal, setShowAttachmentsModal] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showReconciliation, setShowReconciliation] = useState<Account | null>(null)
  const [showCashFlowProjection, setShowCashFlowProjection] = useState(false)
  
  // Refs para os dropdowns
  const newDropdownRef = useRef<HTMLDivElement>(null)
  const reportsDropdownRef = useRef<HTMLDivElement>(null)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    description: '',
    category: 'receitas_servicos',
    type: 'receita' as 'receita' | 'despesa',
    amount: '',
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    client_id: '',
    supplier_id: '',
    enable_split: false,
    cost_center: '',
    reference_code: '',
    repeat_transaction: false,
    installments: 1,
    due_date: '',
    payment_method: '',
    is_paid: false,
    is_scheduled: false,
    nsu: '',
    notes: '',
    attachments: [] as File[]
  })

  // Debounce para pesquisa
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Hooks customizados
  const selection = useTransactionSelection(transactions)
  const { loadingState } = useTransactionActions(refreshData)

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    recebido: { label: 'Recebido', color: 'bg-green-100 text-green-800' },
    pago: { label: 'Pago', color: 'bg-blue-100 text-blue-800' },
    vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
    cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
  }

  // Meses do ano
  const months = [
    { value: 'all', label: 'Todos os meses' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ]

  // Categorias combinadas
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

  // Verificar se há filtros ativos
  const hasActiveFilters = () => {
    return (
      debouncedSearchTerm.trim() !== '' ||
      selectedAccounts.length > 0 ||
      (dateFilterType === 'month' && selectedMonth !== 'all') ||
      (dateFilterType === 'custom' && (customDateRange.start || customDateRange.end))
    )
  }

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAccounts([])
    setSelectedMonth('all')
    setDateFilterType('year')
    setCustomDateRange({ start: '', end: '' })
  }

  // Click outside para fechar dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newDropdownRef.current && !newDropdownRef.current.contains(event.target as Node)) {
        setShowNewDropdown(false)
      }
      if (reportsDropdownRef.current && !reportsDropdownRef.current.contains(event.target as Node)) {
        setShowReportsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      // Filtros de data
      if (dateFilterType === 'year') {
        const startDate = `${selectedYear}-01-01`
        const endDate = `${selectedYear}-12-31`
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
      } else if (dateFilterType === 'month' && selectedMonth !== 'all') {
        const startDate = `${selectedYear}-${selectedMonth}-01`
        const endDate = `${selectedYear}-${selectedMonth}-31`
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
      } else if (dateFilterType === 'custom') {
        if (customDateRange.start) {
          query = query.gte('transaction_date', customDateRange.start)
        }
        if (customDateRange.end) {
          query = query.lte('transaction_date', customDateRange.end)
        }
      }

      // Filtro por contas
      if (selectedAccounts.length > 0) {
        query = query.in('account_id', selectedAccounts)
      }

      // Filtro por busca
      if (debouncedSearchTerm) {
        query = query.or(`description.ilike.%${debouncedSearchTerm}%,company.ilike.%${debouncedSearchTerm}%`)
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
  }, [selectedYear, selectedMonth, dateFilterType, customDateRange, selectedAccounts, debouncedSearchTerm])

  // Limpar seleção ao mudar filtros
  useEffect(() => {
    selection.clearSelection()
  }, [selectedYear, selectedMonth, dateFilterType, customDateRange, selectedAccounts, debouncedSearchTerm])

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

      const status = formData.is_paid 
        ? (formData.type === 'receita' ? 'recebido' : 'pago')
        : 'pendente'

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          description: formData.description.trim(),
          category: formData.category,
          type: formData.type,
          amount: parseFloat(formData.amount),
          account_id: formData.account_id,
          transaction_date: formData.transaction_date,
          due_date: formData.due_date || null,
          notes: formData.notes?.trim() || null,
          status: status,
          payment_date: formData.is_paid ? new Date().toISOString() : null,
          client_id: formData.client_id || null,
          supplier_id: formData.supplier_id || null,
          enable_split: formData.enable_split,
          cost_center: formData.cost_center || null,
          reference_code: formData.reference_code || null,
          repeat_transaction: formData.repeat_transaction,
          installments: formData.installments,
          payment_method: formData.payment_method || null,
          is_scheduled: formData.is_scheduled,
          nsu: formData.nsu || null
        }])
        .select()

      if (error) throw error

      // Reset form
      setFormData({
        description: '',
        category: 'receitas_servicos',
        type: 'receita',
        amount: '',
        account_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        client_id: '',
        supplier_id: '',
        enable_split: false,
        cost_center: '',
        reference_code: '',
        repeat_transaction: false,
        installments: 1,
        due_date: '',
        payment_method: '',
        is_paid: false,
        is_scheduled: false,
        nsu: '',
        notes: '',
        attachments: []
      })

      setShowNewTransactionModal(false)
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

  // Toggle account selection
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
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
      {/* Header Premium da página - SEM BOTÃO NOVO REGISTRO */}
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
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 hover:bg-blue-500 rounded-lg transition-colors"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

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

        {/* Barra premium vazia */}
        <div className="px-6 pb-4">
          {/* Removido o botão novo registro daqui */}
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

        {/* BOTÕES DE AÇÃO COM NOVO REGISTRO NO LADO DIREITO */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {/* Dropdown + Nova */}
            <div className="relative" ref={newDropdownRef}>
              <button 
                onClick={() => {
                  setShowNewDropdown(!showNewDropdown)
                  setShowReportsDropdown(false)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showNewDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-48">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowNewTransactionModal(true)
                        setShowNewDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Nova Transação</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCategoriesManager(true)
                        setShowNewDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Gerenciar Categorias</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountsManager(true)
                        setShowNewDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Gerenciar Contas</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Dropdown Relatórios */}
            <div className="relative" ref={reportsDropdownRef}>
              <button 
                onClick={() => {
                  setShowReportsDropdown(!showReportsDropdown)
                  setShowNewDropdown(false)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>Relatórios</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showReportsDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-56">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowCashFlowProjection(true)
                        setShowReportsDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Projeção do Fluxo de Caixa</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReconciliation(accounts[0] || null)
                        setShowReportsDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Conciliação Bancária</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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

          {/* BOTÃO NOVO REGISTRO DE VOLTA AQUI NO LADO DIREITO */}
          <button 
            onClick={() => setShowNewTransactionModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Novo registro</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* FILTROS */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Filtro de Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              
              <div className="flex bg-gray-100 rounded-lg p-1 mb-2">
                <button
                  type="button"
                  onClick={() => setDateFilterType('year')}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                    dateFilterType === 'year'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ano
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType('month')}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                    dateFilterType === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mês
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType('custom')}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                    dateFilterType === 'custom'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Personalizado
                </button>
              </div>

              {/* Seletores baseados no tipo */}
              {dateFilterType === 'year' && (
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
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center font-medium text-gray-900"
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
              )}

              {dateFilterType === 'month' && (
                <div className="space-y-2">
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {dateFilterType === 'custom' && (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Data inicial"
                  />
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    placeholder="Data final"
                  />
                </div>
              )}
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pesquisar no período selecionado
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-600"
                />
              </div>
            </div>

            {/* Seletor de Contas */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contas
              </label>
              <button
                onClick={() => setShowAccountSelector(!showAccountSelector)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left text-gray-900 flex items-center justify-between"
              >
                <span>
                  {selectedAccounts.length === 0 
                    ? 'Selecionar contas'
                    : selectedAccounts.length === 1 
                      ? accounts.find(a => a.id === selectedAccounts[0])?.name
                      : `${selectedAccounts.length} contas selecionadas`
                  }
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showAccountSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  <div className="p-2">
                    {accounts.map(account => (
                      <label
                        key={account.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={() => toggleAccountSelection(account.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">{account.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botão Limpar Filtros */}
            <div className="flex items-end">
              {hasActiveFilters() && (
                <button 
                  onClick={clearFilters}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 h-10"
                >
                  <X className="w-4 h-4" />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Selection shortcuts */}
          {transactions.length > 0 && (
            <div className="mt-4 flex items-center justify-end">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Selecionar:</span>
                <button 
                  onClick={() => selection.selectByStatus('pendente')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Pendentes
                </button>
                <span className="text-gray-400">|</span>
                <button 
                  onClick={() => selection.selectByType('receita')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Receitas
                </button>
                <span className="text-gray-400">|</span>
                <button 
                  onClick={() => selection.selectByType('despesa')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Despesas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Receitas em aberto (R$)</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.receitas_em_aberto)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Receitas realizadas (R$)</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.receitas_realizadas)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Despesas em aberto (R$)</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.despesas_em_aberto)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Despesas realizadas (R$)</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.despesas_realizadas)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow" suppressHydrationWarning>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Total do período (R$)</h3>
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
                {hasActiveFilters() 
                  ? 'Nenhuma transação encontrada com os filtros aplicados.'
                  : 'Comece criando sua primeira transação financeira.'
                }
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
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Situação
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Valor (R$)
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Conta
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
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
                          <p className="text-sm text-gray-600">
                            {allCategories[transaction.type][transaction.category] || transaction.category}
                          </p>
                          {transaction.company && (
                            <p className="text-xs text-gray-500">
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
                          className="text-gray-500 hover:text-blue-600 transition-colors relative"
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

      {/* Click outside para fechar account selector */}
      {showAccountSelector && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowAccountSelector(false)}
        />
      )}

      {/* MODAL NOVA TRANSAÇÃO */}
      {showNewTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Nova {formData.type === 'receita' ? 'Receita' : 'Despesa'}
                  </h2>
                  <p className="text-sm text-gray-600">Preencha as informações do lançamento</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewTransactionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTransaction(); }}>
                {/* Toggle Receita/Despesa */}
                <div className="mb-6">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'receita', category: 'receitas_servicos'})}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        formData.type === 'receita'
                          ? 'bg-green-600 text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'despesa', category: 'despesas_operacionais'})}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        formData.type === 'despesa'
                          ? 'bg-red-600 text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Despesa
                    </button>
                  </div>
                </div>

                {/* Informações do lançamento */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do lançamento</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Cliente/Fornecedor */}
                    <div className="lg:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.type === 'receita' ? 'Cliente' : 'Fornecedor'}
                      </label>
                      <select
                        value={formData.type === 'receita' ? formData.client_id : formData.supplier_id}
                        onChange={(e) => setFormData({
                          ...formData,
                          [formData.type === 'receita' ? 'client_id' : 'supplier_id']: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-700">Selecione...</option>
                      </select>
                      {formData.type === 'receita' && (
                        <button type="button" className="mt-1 text-xs text-blue-600 hover:text-blue-800">
                          📋 Consultar cliente no Serasa
                        </button>
                      )}
                    </div>

                    {/* Data de competência */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de competência *
                      </label>
                      <input
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      />
                    </div>

                    {/* Valor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-600">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                          placeholder="0,00"
                          required
                        />
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição *
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                        placeholder="Digite a descrição do lançamento"
                        required
                      />
                    </div>

                    {/* Habilitar rateio */}
                    <div className="lg:col-span-1">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.enable_split}
                          onChange={(e) => setFormData({...formData, enable_split: e.target.checked})}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Habilitar rateio</span>
                      </label>
                    </div>

                    {/* Categoria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      >
                        {formData.type === 'receita' ? (
                          <>
                            <option value="receitas_servicos" className="text-gray-700">Receitas de Serviços</option>
                            <option value="receitas_produtos" className="text-gray-700">Receitas de Produtos</option>
                            <option value="receitas_outras" className="text-gray-700">Outras Receitas</option>
                          </>
                        ) : (
                          <>
                            <option value="despesas_operacionais" className="text-gray-700">Despesas Operacionais</option>
                            <option value="despesas_administrativas" className="text-gray-700">Despesas Administrativas</option>
                            <option value="despesas_pessoal" className="text-gray-700">Despesas com Pessoal</option>
                            <option value="despesas_marketing" className="text-gray-700">Despesas de Marketing</option>
                            <option value="despesas_tecnologia" className="text-gray-700">Despesas de Tecnologia</option>
                            <option value="despesas_outras" className="text-gray-700">Outras Despesas</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Centro de custo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Centro de custo
                      </label>
                      <select
                        value={formData.cost_center}
                        onChange={(e) => setFormData({...formData, cost_center: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-700">Selecione...</option>
                        <option value="administrativo" className="text-gray-700">Administrativo</option>
                        <option value="comercial" className="text-gray-700">Comercial</option>
                        <option value="operacional" className="text-gray-700">Operacional</option>
                        <option value="tecnologia" className="text-gray-700">Tecnologia</option>
                      </select>
                    </div>

                    {/* Código de referência */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código de referência
                      </label>
                      <input
                        type="text"
                        value={formData.reference_code}
                        onChange={(e) => setFormData({...formData, reference_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                        placeholder="Ex: NF-2025-001"
                      />
                    </div>

                    {/* Repetir lançamento */}
                    <div className="lg:col-span-1">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.repeat_transaction}
                          onChange={(e) => setFormData({...formData, repeat_transaction: e.target.checked})}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Repetir lançamento?</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Condição de pagamento */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Condição de pagamento</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Parcelamento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parcelamento *
                      </label>
                      <select
                        value={formData.installments}
                        onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value={1} className="text-gray-700">À vista</option>
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i+2} value={i+2} className="text-gray-700">{i+2}x</option>
                        ))}
                      </select>
                    </div>

                    {/* Vencimento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vencimento *
                      </label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        required
                      />
                    </div>

                    {/* Forma de pagamento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forma de pagamento
                      </label>
                      <select
                        value={formData.payment_method}
                        onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-700">Selecione...</option>
                        <option value="dinheiro" className="text-gray-700">Dinheiro</option>
                        <option value="pix" className="text-gray-700">PIX</option>
                        <option value="cartao_credito" className="text-gray-700">Cartão de Crédito</option>
                        <option value="cartao_debito" className="text-gray-700">Cartão de Débito</option>
                        <option value="transferencia" className="text-gray-700">Transferência</option>
                        <option value="boleto" className="text-gray-700">Boleto</option>
                      </select>
                    </div>

                    {/* Conta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conta de {formData.type === 'receita' ? 'recebimento' : 'pagamento'}
                      </label>
                      <select
                        value={formData.account_id}
                        onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="" className="text-gray-700">Selecione...</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id} className="text-gray-700">
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Checkboxes de status */}
                  <div className="mt-4 flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_paid}
                        onChange={(e) => setFormData({...formData, is_paid: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {formData.type === 'receita' ? 'Recebido' : 'Pago'}
                      </span>
                    </label>
                    
                    {formData.type === 'despesa' && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.is_scheduled}
                          onChange={(e) => setFormData({...formData, is_scheduled: e.target.checked})}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Agendado</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* NSU (apenas para receitas) */}
                {formData.type === 'receita' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Informar NSU
                    </label>
                    <input
                      type="text"
                      value={formData.nsu}
                      onChange={(e) => setFormData({...formData, nsu: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                      placeholder="Número sequencial único"
                    />
                  </div>
                )}

                {/* Observações e Anexos */}
                <div className="mb-6">
                  <div className="flex border-b">
                    <button
                      type="button"
                      className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium"
                    >
                      Observações
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Anexo
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                      placeholder="Descreva observações relevantes sobre esse lançamento financeiro"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTransactionModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <span>Salvar</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </form>
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
              <p className="text-gray-700 mb-4">
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

      {/* MODAIS */}
      {showCategoriesManager && (
        <CustomCategoriesManager
          onClose={() => setShowCategoriesManager(false)}
          onCategoryUpdate={fetchCustomCategories}
        />
      )}

      {showAccountsManager && (
        <AccountsManager
          accounts={accounts}
          onClose={() => setShowAccountsManager(false)}
          onAccountUpdate={fetchAccounts}
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

export default function FinanceiroPage() {
  return (
    <ToastProvider>
      <FinanceiroPageContent />
    </ToastProvider>
  )
}