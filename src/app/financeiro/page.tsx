'use client'

import { useState } from 'react'
import { useFinancialData } from '@/hooks/useFinancialData'
import { Plus, Search, Download, Filter, RefreshCw } from 'lucide-react'

export default function FinanceiroPage() {
  const { 
    transactions, 
    accounts, 
    metrics, 
    loading, 
    error, 
    refreshData,
    markTransactionAsPaid,
    formatCurrency,
    formatDate,
    getStatusColor
  } = useFinancialData()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMarkAsPaid = async (transactionId) => {
    const result = await markTransactionAsPaid(transactionId)
    if (result.success) {
      alert('Transação marcada como paga!')
    } else {
      alert('Erro ao marcar como paga: ' + result.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 mb-4">Erro ao carregar dados: {error}</p>
            <button 
              onClick={refreshData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
              <p className="text-sm text-gray-600">
                Gestão financeira da OpOne • {transactions.length} transações
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={refreshData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </button>

              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </button>

              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>

              <button 
                onClick={() => setShowNewTransactionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Receitas em Aberto</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.receitasEmAberto || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Valores a receber</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Receitas Realizadas</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.receitasRealizadas || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Valores recebidos</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Despesas em Aberto</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics?.despesasEmAberto || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Valores a pagar</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Saldo do Período</h3>
            <p className={`text-2xl font-bold ${
              (metrics?.saldoPeriodo || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {formatCurrency(metrics?.saldoPeriodo || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Receitas - Despesas</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Transações ({filteredTransactions.length})
            </h2>
          </div>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhuma transação encontrada' : 'Nenhuma transação cadastrada'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Tente ajustar sua busca ou limpar o filtro'
                  : 'Comece criando sua primeira transação financeira'
                }
              </p>
              <button 
                onClick={() => setShowNewTransactionModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Nova Transação
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'receita' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {transaction.account?.name || 'Conta não informada'} • {formatDate(transaction.transaction_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        getStatusColor(transaction.status)
                      }`}>
                        {transaction.status}
                      </span>
                      
                      {transaction.status === 'pendente' && (
                        <button
                          onClick={() => handleMarkAsPaid(transaction.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Marcar como {transaction.type === 'receita' ? 'recebido' : 'pago'}
                        </button>
                      )}
                      
                      <span className={`text-lg font-semibold ${
                        transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'receita' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Transação (Placeholder) */}
      {showNewTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Nova Transação</h3>
            <p className="text-gray-600 mb-4">
              Modal de criação de transações será implementado em breve.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewTransactionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}