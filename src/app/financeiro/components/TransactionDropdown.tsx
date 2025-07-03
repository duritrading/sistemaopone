// src/app/financeiro/components/TransactionDropdown.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  MoreHorizontal, Check, Clock, Edit2, Copy, FileDown, 
  Trash2, Eye, MessageSquare, Calendar, DollarSign
} from 'lucide-react'
import { Transaction } from '../types/financial'
import { useTransactionActions } from '../hooks/useTransactionActions'

interface TransactionDropdownProps {
  transaction: Transaction
  onRefresh: () => Promise<void>
}

export function TransactionDropdown({ transaction, onRefresh }: TransactionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { loadingState, markAsPaid, markAsPending, deleteTransactions, duplicateTransactions } = useTransactionActions(onRefresh)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsPaid = async () => {
    await markAsPaid([transaction.id])
    setIsOpen(false)
  }

  const handleMarkAsPending = async () => {
    await markAsPending([transaction.id])
    setIsOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }
    
    await deleteTransactions([transaction.id])
    setIsOpen(false)
  }

  const handleDuplicate = async () => {
    await duplicateTransactions([transaction.id])
    setIsOpen(false)
  }

  const downloadReceipt = () => {
    // Mock implementation - would integrate with real receipt system
    const receiptContent = `
COMPROVANTE DE TRANSAÇÃO
========================

Descrição: ${transaction.description}
Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
Tipo: ${transaction.type === 'receita' ? 'Receita' : 'Despesa'}
Status: ${transaction.status}
Data: ${new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
${transaction.company ? `Empresa: ${transaction.company}` : ''}
${transaction.notes ? `Observações: ${transaction.notes}` : ''}

Gerado em: ${new Date().toLocaleString('pt-BR')}
    `

    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comprovante_${transaction.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const getStatusInfo = () => {
    switch (transaction.status) {
      case 'pendente':
        return { canMarkPaid: true, canMarkPending: false }
      case 'recebido':
      case 'pago':
        return { canMarkPaid: false, canMarkPending: true }
      default:
        return { canMarkPaid: false, canMarkPending: false }
    }
  }

  const { canMarkPaid, canMarkPending } = getStatusInfo()

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingState.isLoading}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-30 animate-in slide-in-from-top-2 duration-200">
          <div className="py-1">
            {/* Status Actions */}
            {canMarkPaid && (
              <button
                onClick={handleMarkAsPaid}
                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors"
              >
                <Check className="w-4 h-4 mr-3" />
                Marcar como {transaction.type === 'receita' ? 'recebido' : 'pago'}
              </button>
            )}

            {canMarkPending && (
              <button
                onClick={handleMarkAsPending}
                className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
              >
                <Clock className="w-4 h-4 mr-3" />
                Marcar como pendente
              </button>
            )}

            {(canMarkPaid || canMarkPending) && (
              <div className="border-t border-gray-100 my-1"></div>
            )}

            {/* View Actions */}
            <button
              onClick={() => {
                setShowNotes(true)
                setIsOpen(false)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 mr-3" />
              Ver detalhes
            </button>

            <button
              onClick={downloadReceipt}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4 mr-3" />
              Baixar comprovante
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Edit Actions */}
            <button
              onClick={() => {
                // Would open edit modal
                console.log('Edit transaction:', transaction.id)
                setIsOpen(false)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4 mr-3" />
              Editar transação
            </button>

            <button
              onClick={handleDuplicate}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4 mr-3" />
              Duplicar transação
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Dangerous Actions */}
            <button
              onClick={handleDelete}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Excluir transação
            </button>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showNotes && (
        <TransactionDetailsModal
          transaction={transaction}
          onClose={() => setShowNotes(false)}
        />
      )}
    </div>
  )
}

function TransactionDetailsModal({ 
  transaction, 
  onClose 
}: { 
  transaction: Transaction
  onClose: () => void 
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    recebido: { label: 'Recebido', color: 'bg-green-100 text-green-800 border-green-200' },
    pago: { label: 'Pago', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800 border-red-200' },
    cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              transaction.type === 'receita' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Detalhes da Transação</h2>
              <p className="text-sm text-gray-500">ID: {transaction.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Eye className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
              <p className="text-gray-900 font-medium">{transaction.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${statusConfig[transaction.status].color}`}>
                {statusConfig[transaction.status].label}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Valor</label>
              <p className={`text-xl font-bold ${
                transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Categoria</label>
              <p className="text-gray-900">{transaction.category}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Data da Transação</label>
              <p className="text-gray-900">{formatDate(transaction.transaction_date)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Conta</label>
              <p className="text-gray-900">{transaction.account?.name || 'N/A'}</p>
            </div>

            {transaction.due_date && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Data de Vencimento</label>
                <p className="text-gray-900">{formatDate(transaction.due_date)}</p>
              </div>
            )}

            {transaction.payment_date && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Data de Pagamento</label>
                <p className="text-gray-900">{formatDate(transaction.payment_date)}</p>
              </div>
            )}

            {transaction.company && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Empresa/Cliente</label>
                <p className="text-gray-900">{transaction.company}</p>
              </div>
            )}

            {transaction.notes && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Observações</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{transaction.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Criado em:</span> {new Date(transaction.created_at).toLocaleString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span> {new Date(transaction.updated_at).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}