// src/app/financeiro/components/ViewTransactionModal.tsx
'use client'

import { X, Calendar, DollarSign, Tag, Building, FileText, User, Clock } from 'lucide-react'

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
  account?: {
    id: string
    name: string
    type: string
  }
}

interface ViewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

export default function ViewTransactionModal({
  isOpen,
  onClose,
  transaction
}: ViewTransactionModalProps) {
  if (!isOpen || !transaction) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
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
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getTypeInfo = () => {
    if (transaction.type === 'receita') {
      return {
        label: 'Receita',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        sign: '+'
      }
    } else {
      return {
        label: 'Despesa',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        sign: '-'
      }
    }
  }

  const typeInfo = getTypeInfo()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
              <DollarSign className={`w-6 h-6 ${typeInfo.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalhes da {typeInfo.label}</h2>
              <p className="text-sm text-gray-600 mt-1">
                ID: {transaction.id.substring(0, 8)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Descrição
                </label>
                <p className="text-lg font-semibold text-gray-900">{transaction.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Valor
                </label>
                <p className={`text-2xl font-bold ${typeInfo.color}`}>
                  {typeInfo.sign}{formatCurrency(transaction.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {getStatusBadge(transaction.status)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Categoria
                </label>
                <p className="text-gray-900">{transaction.category}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="w-4 h-4 inline mr-2" />
                  Conta
                </label>
                <p className="text-gray-900">{transaction.account?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Conta
                </label>
                <p className="text-gray-600 text-sm">{transaction.account?.type}</p>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data da Transação
                </label>
                <p className="text-gray-900">{formatDate(transaction.transaction_date)}</p>
              </div>

              {transaction.due_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Data de Vencimento
                  </label>
                  <p className="text-gray-900">{formatDate(transaction.due_date)}</p>
                </div>
              )}

              {transaction.payment_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Data de Pagamento
                  </label>
                  <p className="text-gray-900">{formatDateTime(transaction.payment_date)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {transaction.notes && (
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{transaction.notes}</p>
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <label className="block font-medium mb-1">Criado em</label>
                <p>{formatDateTime(transaction.created_at)}</p>
              </div>
              <div>
                <label className="block font-medium mb-1">Última atualização</label>
                <p>{formatDateTime(transaction.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}