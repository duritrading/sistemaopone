// src/presentation/financial/components/TransactionCard.tsx
import React, { memo } from 'react'
import { TransactionEntity } from '@/domain/financial/entities/Transaction'
import { Paperclip, Calendar, Building2, User, MoreHorizontal } from 'lucide-react'

interface TransactionCardProps {
  transaction: TransactionEntity
  isSelected?: boolean
  onSelect?: (id: string) => void
  onEdit?: (transaction: TransactionEntity) => void
  onDelete?: (transaction: TransactionEntity) => void
  onViewAttachments?: (transaction: TransactionEntity) => void
  className?: string
}

export const TransactionCard = memo(function TransactionCard({
  transaction,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onViewAttachments,
  className = ''
}: TransactionCardProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect?.(transaction.id)
  }

  const handleCardClick = () => {
    onEdit?.(transaction)
  }

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}
      `}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Checkbox */}
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {transaction.description}
              </h3>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${transaction.getStatusColor()}`}>
                {transaction.status}
              </span>
            </div>

            {/* Amount */}
            <div className="mb-2">
              <span className={`text-lg font-semibold ${
                transaction.isRevenue() ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.isRevenue() ? '+' : '-'}{transaction.getFormattedAmount()}
              </span>
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{transaction.transactionDate.toLocaleDateString('pt-BR')}</span>
              </div>
              
              {transaction.category && (
                <div className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{transaction.category}</span>
                </div>
              )}
              
              {transaction.clientId && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Cliente</span>
                </div>
              )}
            </div>

            {/* Due date for pending transactions */}
            {transaction.status === 'pendente' && transaction.dueDate && (
              <div className="mt-2 text-xs text-gray-600">
                Vencimento: {transaction.dueDate.toLocaleDateString('pt-BR')}
                {transaction.isOverdue() && (
                  <span className="ml-2 text-red-600 font-medium">VENCIDO</span>
                )}
              </div>
            )}

            {/* Notes */}
            {transaction.notes && (
              <div className="mt-2 text-xs text-gray-600 truncate">
                {transaction.notes}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Attachments */}
          {transaction.attachments.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewAttachments?.(transaction)
              }}
              className="p-1 text-gray-400 hover:text-blue-600 relative"
              title="Ver anexos"
            >
              <Paperclip className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {transaction.attachments.length}
              </span>
            </button>
          )}

          {/* More actions */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Open dropdown menu
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Mais ações"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
})