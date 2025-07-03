// src/app/financeiro/page.tsx - INTEGRADO COM SUPABASE
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Plus, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  FileDown, Printer, Upload, MoreHorizontal, X, Edit2, Trash2,
  DollarSign, Building2, Calendar, FileText, AlertCircle
} from 'lucide-react'

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types
interface Transaction {
  id: string
  description: string
  category: string
  type: 'receita' | 'despesa'
  amount: number
  status: 'pendente' | 'recebido' | 'pago' | 'vencido' | 'cancelado'
  transaction_date: string
  due_date?: string
  payment_date?: string
  account_id: string
  company?: string
  document?: string
  notes?: string
  created_at: string
  updated_at: string
  account?: {
    name: string
    type: string
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
  receitas_em_aberto: number
  receitas_realizadas: number
  despesas_em_aberto: number
  despesas_realizadas: number
  total_periodo: number
}

export default function FinanceiroPage() {
  // Estados
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
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
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados dos modais
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
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

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    recebido: { label: 'Recebido', color: 'bg-green-100 text-green-800' },
    pago: { label: 'Pago', color: 'bg-blue-100 text-blue-800' },
    vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
    cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
  }

  const categoryOptions = {
    receita: {
      'receitas_servicos': 'Receitas de Serviços',
      'receitas_produtos': 'Receitas de Produtos',
      'receitas_outras': 'Outras Receitas'
    },
    despesa: {
      'despesas_operacionais': 'Despesas Operacionais',
      'despesas_administrativas': 'Despesas Administrativas',
      'despesas_pessoal': 'Despesas com Pessoal',
      'despesas_marketing': 'Despesas de Marketing',
      'despesas_tecnologia': 'Despesas de Tecnologia',
      'despesas_outras': 'Outras Despesas'
    }
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
      // Não mostra erro para métricas pois não é crítico
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchMetrics()
      ])
      setLoading(false)
    }
    
    loadData()
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
      await Promise.all([fetchTransactions(), fetchMetrics()])
      
      alert('Transação criada com sucesso!')
    } catch (err: any) {
      console.error('Erro ao criar transação:', err)
      alert('Erro ao criar transação: ' + err.message)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error

      // Recarregar dados
      await Promise.all([fetchTransactions(), fetchMetrics()])
      
      alert('Transação excluída com sucesso!')
    } catch (err: any) {
      console.error('Erro ao excluir transação:', err)
      alert('Erro ao excluir transação: ' + err.message)
    }
  }

  const handleMarkAsPaid = async (transactionId: string, currentStatus: string) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId)
      if (!transaction) return

      const newStatus = transaction.type === 'receita' ? 'recebido' : 'pago'
      
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: newStatus,
          payment_date: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (error) throw error

      // Recarregar dados
      await Promise.all([fetchTransactions(), fetchMetrics()])
      
      alert(`Transação marcada como ${newStatus}!`)
    } catch (err: any) {
      console.error('Erro ao atualizar transação:', err)
      alert('Erro ao atualizar transação: ' + err.message)
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

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(transactions.map(t => t.id))
    }
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
      {/* Header da página */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Extrato Financeiro</h1>
          <div className="flex items-center space-x-4">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Novidades
            </button>
            <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
              Ajuda
            </button>
            <div className="text-right">
              <p className="text-xs text-gray-500">OpOne LAB</p>
              <p className="text-xs text-gray-600">Configurações e plano</p>
            </div>
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
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

          <div className="mt-4">
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
          </div>
        </div>

        {/* Metrics Cards - DADOS REAIS DO SUPABASE */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Receitas em aberto (R$)</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.receitas_em_aberto)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Receitas realizadas (R$)</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.receitas_realizadas)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Despesas em aberto (R$)</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.despesas_em_aberto)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Despesas realizadas (R$)</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.despesas_realizadas)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total do período (R$)</h3>
            <p className={`text-2xl font-bold ${metrics.total_periodo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.total_periodo)}
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTransactions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedTransactions.length} registro(s) selecionado(s)
              </span>
              <div className="flex items-center space-x-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                  Pagar pelo CA de Bolso
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm">
                  <span>Ações em lote</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table - DADOS REAIS DO SUPABASE */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
                        checked={selectedTransactions.length === transactions.length}
                        onChange={handleSelectAll}
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
                    <th className="w-16 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id)}
                          onChange={() => handleSelectTransaction(transaction.id)}
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
                            {transaction.category}
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
                      <td className="px-6 py-4">
                        <div className="relative group">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <div className="py-1">
                              {transaction.status === 'pendente' && (
                                <button
                                  onClick={() => handleMarkAsPaid(transaction.id, transaction.status)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Marcar como {transaction.type === 'receita' ? 'recebido' : 'pago'}
                                </button>
                              )}
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                              </button>
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <FileDown className="w-4 h-4 mr-2" />
                                Baixar comprovante
                              </button>
                              <div className="border-t border-gray-100"></div>
                              <button 
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NOVA TRANSAÇÃO - COM DADOS REAIS */}
      {showNewTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
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
                    {Object.entries(categoryOptions[formData.type]).map(([key, label]) => (
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
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
    </div>
  )
}