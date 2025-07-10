'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, Eye, MoreVertical } from 'lucide-react'
import { formatCurrency } from '@/lib/utils' // ou substitua pela sua função local
import TransactionActionsDropdown from './TransactionActionsDropdown'

interface TransactionCardProps {
  transaction: Transaction
  selected: boolean
  onSelect: (id: string) => void
  onAction: (
    transactionId: string,
    action: 'mark_paid' | 'mark_pending' | 'edit' | 'delete' | 'view' | 'duplicate'
  ) => void
}

export default function TransactionCard({
  transaction,
  selected,
  onSelect,
  onAction
}: TransactionCardProps) {
  const statusBadge = {
    pendente: 'bg-yellow-100 text-yellow-700',
    recebido: 'bg-green-100 text-green-700',
    pago: 'bg-green-100 text-green-700',
    vencido: 'bg-red-100 text-red-700',
    cancelado: 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Seleção + Data + Descrição */}
      <div className="flex items-start sm:items-center gap-3 w-full sm:w-2/3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(transaction.id)}
          className="mt-1 sm:mt-0 border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">
            {transaction.description}
          </span>
          <span className="text-xs text-gray-500">
            {transaction.category} • {transaction.account?.name}
          </span>
        </div>
      </div>

      {/* Data e Valor */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full sm:w-1/3">
        <div className="text-sm text-gray-500 whitespace-nowrap">
          {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadge[transaction.status]}`}
          >
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
          <span
            className={`font-semibold text-sm ${
              transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {transaction.type === 'receita' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="sm:self-start">
        <TransactionActionsDropdown
          transaction={transaction}
          onMarkAsPaid={() => onAction(transaction.id, 'mark_paid')}
          onMarkAsPending={() => onAction(transaction.id, 'mark_pending')}
          onEdit={() => onAction(transaction.id, 'edit')}
          onDelete={() => onAction(transaction.id, 'delete')}
          onView={() => onAction(transaction.id, 'view')}
          onDuplicate={() => onAction(transaction.id, 'duplicate')}
        />
      </div>
    </div>
  )
}
