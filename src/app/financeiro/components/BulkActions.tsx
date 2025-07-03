// src/app/financeiro/components/BulkActions.tsx
'use client'

import { useState } from 'react'
import { 
  Check, Clock, Copy, Trash2, Tag, ChevronDown, X,
  DollarSign, AlertTriangle, FileDown
} from 'lucide-react'
import { Transaction } from '../types/financial'
import { useTransactionActions } from '../hooks/useTransactionActions'

interface BulkActionsProps {
  selectedTransactions: Transaction[]
  selectionStats: {
    receitas: number
    despesas: number
    receitasCount: number
    despesasCount: number
    total: number
    count: number
  }
  onClearSelection: () => void
  onRefresh: () => Promise<void>
}

export function BulkActions({ 
  selectedTransactions, 
  selectionStats, 
  onClearSelection,
  onRefresh 
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const { loadingState, markAsPaid, markAsPending, deleteTransactions, duplicateTransactions, updateCategory } = useTransactionActions(onRefresh)

  const selectedIds = selectedTransactions.map(t => t.id)
  
  const pendingCount = selectedTransactions.filter(t => t.status === 'pendente').length
  const paidCount = selectedTransactions.filter(t => ['recebido', 'pago'].includes(t.status)).length

  const handleMarkAsPaid = async () => {
    const pendingIds = selectedTransactions
      .filter(t => t.status === 'pendente')
      .map(t => t.id)
    
    if (pendingIds.length === 0) {
      alert('Nenhuma transação pendente selecionada')
      return
    }
    
    await markAsPaid(pendingIds)
    onClearSelection()
  }

  const handleMarkAsPending = async () => {
    const paidIds = selectedTransactions
      .filter(t => ['recebido', 'pago'].includes(t.status))
      .map(t => t.id)
    
    if (paidIds.length === 0) {
      alert('Nenhuma transação paga selecionada')
      return
    }
    
    await markAsPending(paidIds)
    onClearSelection()
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectionStats.count} transação(ões)?`)) {
      return
    }
    
    await deleteTransactions(selectedIds)
    onClearSelection()
  }

  const handleDuplicate = async () => {
    await duplicateTransactions(selectedIds)
    onClearSelection()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Empresa', 'Tipo', 'Status', 'Valor']
    const csvContent = [
      headers.join(','),
      ...selectedTransactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString('pt-BR'),
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
    link.download = `transacoes_selecionadas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
      {/* Selection Summary */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{selectionStats.count}</span>
            </div>
            <span className="text-blue-800 font-medium">
              {selectionStats.count} registro(s) selecionado(s)
            </span>
          </div>
          
          <div className="h-4 w-px bg-blue-300"></div>
          
          <div className="flex items-center space-x-3 text-sm">
            {selectionStats.receitasCount > 0 && (
              <span className="text-green-700">
                <DollarSign className="w-4 h-4 inline mr-1" />
                {selectionStats.receitasCount} receita(s) - {formatCurrency(selectionStats.receitas)}
              </span>
            )}
            {selectionStats.despesasCount > 0 && (
              <span className="text-red-700">
                <DollarSign className="w-4 h-4 inline mr-1" />
                {selectionStats.despesasCount} despesa(s) - {formatCurrency(selectionStats.despesas)}
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-800 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {pendingCount > 0 && (
            <button
              onClick={handleMarkAsPaid}
              disabled={loadingState.isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Marcar como pago ({pendingCount})</span>
            </button>
          )}

          {paidCount > 0 && (
            <button
              onClick={handleMarkAsPending}
              disabled={loadingState.isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Marcar como pendente ({paidCount})</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
          >
            <span>Mais ações</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <button
                  onClick={() => {
                    handleDuplicate()
                    setShowActions(false)
                  }}
                  disabled={loadingState.isLoading}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar transações
                </button>
                
                <button
                  onClick={() => {
                    setShowCategoryModal(true)
                    setShowActions(false)
                  }}
                  disabled={loadingState.isLoading}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Alterar categoria
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={() => {
                    handleDelete()
                    setShowActions(false)
                  }}
                  disabled={loadingState.isLoading}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir selecionadas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loadingState.isLoading && (
        <div className="mt-3 flex items-center space-x-2 text-blue-700">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">{loadingState.message}</span>
        </div>
      )}

      {/* Total Summary */}
      {selectionStats.count > 1 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Impacto total da seleção:</span>
            <span className={`font-medium ${selectionStats.total >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(selectionStats.total)}
            </span>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onUpdate={(category) => {
            updateCategory(selectedIds, category)
            setShowCategoryModal(false)
            onClearSelection()
          }}
          selectedCount={selectionStats.count}
        />
      )}
    </div>
  )
}

function CategoryModal({ 
  onClose, 
  onUpdate, 
  selectedCount 
}: { 
  onClose: () => void
  onUpdate: (category: string) => void
  selectedCount: number
}) {
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Alterar Categoria</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Alterar categoria de {selectedCount} transação(ões) selecionada(s).
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receitas
              </label>
              <div className="space-y-2">
                {Object.entries(categories.receita).map(([key, label]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={key}
                      checked={selectedCategory === key}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Despesas
              </label>
              <div className="space-y-2">
                {Object.entries(categories.despesa).map(([key, label]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={key}
                      checked={selectedCategory === key}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={() => onUpdate(selectedCategory)}
            disabled={!selectedCategory}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Atualizar Categoria
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}