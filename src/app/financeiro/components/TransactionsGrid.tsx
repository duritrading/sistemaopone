// src/app/financeiro/components/TransactionsGrid.tsx
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
  Eye
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

interface TransactionsGridProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string) => void
  onMarkPending: (id: string) => void
  onView: (transaction: Transaction) => void
  loading?: boolean
}

export default function TransactionsGrid({
  transactions,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkPending,
  onView,
  loading = false
}: TransactionsGridProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    // Formato compacto para grid
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {transactions.map((transaction) => {
        const statusConfig = getStatusConfig(transaction.status)
        const StatusIcon = statusConfig.icon
        const isReceita = transaction.type === 'receita'
        const canMarkPaid = ['pendente', 'vencido'].includes(transaction.status)
        const canMarkPending = ['recebido', 'pago'].includes(transaction.status)

        return (
          <div 
            key={transaction.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 p-4 group"
          >
            {/* Header do Card */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate" title={transaction.description}>
                  {transaction.description}
                </h3>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Menu de ações */}
              <div className="relative ml-2">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === transaction.id ? null : transaction.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {activeDropdown === transaction.id && (
                  <div className="absolute right-0 top-6 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleAction('view', transaction)}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver detalhes
                      </button>

                      {canMarkPaid && (
                        <button
                          onClick={() => handleAction('mark_paid', transaction)}
                          className="flex items-center w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como {isReceita ? 'recebido' : 'pago'}
                        </button>
                      )}

                      {canMarkPending && (
                        <button
                          onClick={() => handleAction('mark_pending', transaction)}
                          className="flex items-center w-full px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Marcar como pendente
                        </button>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => handleAction('edit', transaction)}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </button>

                      <button
                        onClick={() => handleAction('delete', transaction)}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Valor principal */}
            <div className="mb-3">
              <p className={`text-xl font-bold ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>

            {/* Informações secundárias */}
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center">
                <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate" title={transaction.category}>
                  {transaction.category}
                </span>
              </div>

              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{formatDate(transaction.transaction_date)}</span>
                {transaction.due_date && transaction.due_date !== transaction.transaction_date && (
                  <span className="ml-1 text-gray-400">→ {formatDate(transaction.due_date)}</span>
                )}
              </div>

              {transaction.company && (
                <div className="flex items-center">
                  <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate" title={transaction.company}>
                    {transaction.company}
                  </span>
                </div>
              )}

              <div className="flex items-center">
                <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate" title={transaction.account?.name}>
                  {transaction.account?.name || 'Conta não informada'}
                </span>
              </div>
            </div>

            {/* Ações rápidas (mobile) */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex space-x-2 md:hidden">
              {canMarkPaid && (
                <button
                  onClick={() => handleAction('mark_paid', transaction)}
                  className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  {isReceita ? 'Receber' : 'Pagar'}
                </button>
              )}
              
              <button
                onClick={() => handleAction('view', transaction)}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Ver
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}