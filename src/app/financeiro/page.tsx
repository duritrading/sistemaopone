// src/app/financeiro/page.tsx - VERSÃO FINAL INTEGRADA COM TODOS OS COMPONENTES
'use client'

import { useState } from 'react'
import { 
  Plus, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  FileDown, Printer, Upload, MoreHorizontal, X, 
  Edit2, Trash2, Download, Eye, AlertCircle
} from 'lucide-react'

// Imports dos componentes e hooks criados
import { useFinanceiro } from './hooks/useFinanceiro'
import { NewTransactionModal, EditTransactionModal } from '@/components/modals/financeiro'
import { MetricsDashboard, AdvancedFilters, ExportOptions } from './components'
import { 
  Transaction,
  TRANSACTION_STATUS 
} from '@/types/financeiro'

export default function FinanceiroPage() {
  // === HOOK PRINCIPAL ===
  const {
    transactions,
    accounts,
    metrics,
    loading,
    error,
    filteredTransactions,
    selectedTransactions,
    hasSelection,
    isFiltered,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkAction,
    selectTransaction,
    selectAllTransactions,
    clearSelection,
    updateFilter,
    clearFilters,
    refreshData
  } = useFinanceiro()

  // === ESTADOS LOCAIS DE UI ===
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Modal states
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // === HANDLERS ===
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    updateFilter({ period: { year } })
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    updateFilter({ searchTerm: term })
  }

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId)
    updateFilter({ 
      accounts: accountId === 'all' ? [] : [accountId] 
    })
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowEditTransactionModal(true)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteTransaction(transactionId)
        alert('Transação excluída com sucesso!')
      } catch (error) {
        alert('Erro ao excluir transação')
      }
    }
  }

  const handleBulkMarkAsPaid = async () => {
    if (selectedTransactions.length === 0) return
    
    try {
      await bulkAction({
        type: 'mark_paid',
        transactionIds: selectedTransactions
      })
      alert(`${selectedTransactions.length} transação(ões) marcada(s) como paga(s)!`)
    } catch (error) {
      alert('Erro na ação em lote')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // === RENDER ===
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Action Buttons - Exatamente como na imagem */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => setShowNewTransactionModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <span>Relatórios</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setShowExportOptions(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar</span>
            </button>

            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2">
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

        {/* Filters - Layout exato da imagem */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Period Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleYearChange(selectedYear - 1)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select 
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center font-medium"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
                <button 
                  onClick={() => handleYearChange(selectedYear + 1)}
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
                  onChange={(e) => handleSearchChange(e.target.value)}
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
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Selecionar todas</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
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
                clearFilters()
              }}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>

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

        {/* Metrics Dashboard */}
        <div className="mb-6">
          <MetricsDashboard 
            metrics={metrics} 
            loading={loading}
            year={selectedYear}
          />
        </div>

        {/* Bulk Actions */}
        {hasSelection && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedTransactions.length} registro(s) selecionado(s)
              </span>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleBulkMarkAsPaid}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Pagar pelo CA de Bolso
                </button>
                <div className="relative">
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm">
                    <span>Ações em lote</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Carregando transações...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {isFiltered ? 'Nenhuma transação encontrada com os filtros aplicados' : 'Nenhuma transação cadastrada'}
              </p>
              <button
                onClick={() => setShowNewTransactionModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Nova Transação
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={selectAllTransactions}
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
                      Saldo (R$)
                    </th>
                    <th className="w-16 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id)}
                          onChange={() => selectTransaction(transaction.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(transaction.date)}
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
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${TRANSACTION_STATUS[transaction.status].color}`}>
                          {TRANSACTION_STATUS[transaction.status].label}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${
                        transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(transaction.balance)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown menu */}
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                              </button>
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </button>
                              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <Download className="w-4 h-4 mr-2" />
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

      {/* Modals */}
      <NewTransactionModal
        isOpen={showNewTransactionModal}
        onClose={() => setShowNewTransactionModal(false)}
        onSubmit={createTransaction}
        accounts={accounts}
        projects={[]} // TODO: Integrar com projetos
        clients={[]}  // TODO: Integrar com clientes
      />

      <EditTransactionModal
        isOpen={showEditTransactionModal}
        onClose={() => setShowEditTransactionModal(false)}
        onSubmit={updateTransaction}
        transaction={selectedTransaction}
        accounts={accounts}
        projects={[]} // TODO: Integrar com projetos
        clients={[]}  // TODO: Integrar com clientes
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filter={{
          period: { year: selectedYear },
          accounts: selectedAccount === 'all' ? [] : [selectedAccount],
          searchTerm,
          status: [],
          types: [],
          categories: []
        }}
        onFilterChange={updateFilter}
        accounts={accounts}
      />

      <ExportOptions
        isOpen={showExportOptions}
        onClose={() => setShowExportOptions(false)}
        selectedTransactions={selectedTransactions}
        allTransactions={filteredTransactions}
      />
    </div>
  )
}