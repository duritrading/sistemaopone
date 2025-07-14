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
  Copy,
  User,
  CreditCard
} from 'lucide-react'
import { Transaction } from '../types/financial'

interface TransactionsListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string) => void
  onMarkPending: (id: string) => void
  onView: (transaction: Transaction) => void
  loading?: boolean
  emptyMessage?: string
}

export default function TransactionsList({
  transactions,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkPending,
  onView,
  loading = false,
  emptyMessage = "Nenhuma transação encontrada"
}: TransactionsListProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  const getStatusConfig = (status: Transaction['status']) => {
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
    return configs[status] || configs.pendente
  }

  const getPaymentMethodLabel = (method?: string): string => {
    const methods = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      transferencia: 'Transferência',
      boleto: 'Boleto'
    }
    return method ? methods[method as keyof typeof methods] || method : 'Não informado'
  }

  const handleAction = (action: string, transaction: Transaction) => {
    setActiveDropdown(null)
    
    try {
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
        default:
          console.warn(`Unknown action: ${action}`)
      }
    } catch (error) {
      console.error(`Error handling action ${action}:`, error)
    }
  }

  const handleDropdownToggle = (transactionId: string) => {
    setActiveDropdown(activeDropdown === transactionId ? null : transactionId)
  }

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    setActiveDropdown(null)
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

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
        <p className="text-gray-500">Não há transações para exibir com os filtros atuais.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3" onClick={handleClickOutside}>
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
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      {transaction.category}
                    </span>
                    {transaction.account?.name && (
                      <span className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {transaction.account.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className={`text-xl font-bold ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                      {isReceita ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </p>
                    {transaction.installments && transaction.installments > 1 && (
                      <p className="text-xs text-gray-500">
                        {transaction.installments}x parcelas
                      </p>
                    )}
                  </div>

                  {/* Actions dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDropdownToggle(transaction.id)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {activeDropdown === transaction.id && (
                      <div className="absolute right-0 top-10 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
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
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed information */}
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

                {transaction.payment_method && (
                  <div className="flex items-center text-sm">
                    <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Forma de pagamento</p>
                      <p className="font-medium text-gray-900">{getPaymentMethodLabel(transaction.payment_method)}</p>
                    </div>
                  </div>
                )}

                {transaction.reference_code && (
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Referência</p>
                      <p className="font-medium text-gray-900">{transaction.reference_code}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {transaction.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Observações</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
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