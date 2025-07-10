// src/app/financeiro/components/TransactionsList.tsx
'use client'

import { useState } from 'react'
import { 
  MoreHorizontal, 
  DollarSign, 
  Calendar, 
  Building, 
  Tag,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Edit,
  Trash2,
  Eye,
  Copy
} from 'lucide-react'

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
  account?: {
    name: string
    type: string
  }
  company?: string
  notes?: string
}

interface TransactionsListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string) => void
  onMarkPending: (id: string) => void
  onView: (transaction: Transaction) => void
  loading?: boolean
}

export default function TransactionsList({
  transactions,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkPending,
  onView,
  loading = false
}: TransactionsListProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pendente: {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        label: 'Pendente'
      },
      recebido: {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Recebido'
      },
      pago: {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Pago'
      },
      vencido: {
        icon: AlertTriangle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        label: 'Vencido'
      },
      cancelado: {
        icon: AlertTriangle,
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        label: 'Cancelado'
      }
    }
    return configs[status as keyof typeof configs] || configs.pendente
  }

  const handleAction = (action: string, transaction: Transaction) => {
    setActiveDropdown(null)
    
    switch (action) {
      case 'view':
        onView(transaction)
        break
      case 'edit':
        onEdit(transaction)
        break
      case 'mark_paid':
        onMarkPaid(transaction.id)
        break
      case 'mark_pending':
        onMarkPending(transaction.id)
        break
      case 'delete':
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
          onDelete(transaction.id)
        }
        break
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
        <p className="text-gray-500">Não há transações para exibir com os filtros atuais.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const statusConfig = getStatusConfig(transaction.status)
        const StatusIcon = statusConfig.icon
        const isReceita = transaction.type === 'receita'
        const canMarkPaid = ['pendente', 'vencido'].includes(transaction.status)
        const canMarkPending = ['recebido', 'pago'].includes(transaction.status)

        return (
          <div 
            key={transaction.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {transaction.description}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      {transaction.category}
                    </span>
                    {transaction.company && (
                      <span className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {transaction.company}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Valor */}
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                      {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.account?.name || 'Conta não informada'}
                    </p>
                  </div>

                  {/* Menu de ações */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === transaction.id ? null : transaction.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {activeDropdown === transaction.id && (
                      <div className="absolute right-0 top-10 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleAction('view', transaction)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-3" />
                            Ver detalhes
                          </button>

                          {canMarkPaid && (
                            <button
                              onClick={() => handleAction('mark_paid', transaction)}
                              className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4 mr-3" />
                              Marcar como {isReceita ? 'recebido' : 'pago'}
                            </button>
                          )}

                          {canMarkPending && (
                            <button
                              onClick={() => handleAction('mark_pending', transaction)}
                              className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                            >
                              <Clock className="w-4 h-4 mr-3" />
                              Marcar como pendente
                            </button>
                          )}

                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                            onClick={() => handleAction('edit', transaction)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4 mr-3" />
                            Editar
                          </button>

                          <button
                            onClick={() => handleAction('delete', transaction)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-3" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações detalhadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-gray-500">Data da transação</p>
                    <p className="font-medium text-gray-900">{formatDate(transaction.transaction_date)}</p>
                  </div>
                </div>

                {transaction.due_date && (
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Vencimento</p>
                      <p className="font-medium text-gray-900">{formatDate(transaction.due_date)}</p>
                    </div>
                  </div>
                )}

                {transaction.payment_date && (
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Data do pagamento</p>
                      <p className="font-medium text-gray-900">{formatDate(transaction.payment_date)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-gray-500">Conta</p>
                    <p className="font-medium text-gray-900">{transaction.account?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Observações (se houver) */}
              {transaction.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Observações:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {transaction.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}