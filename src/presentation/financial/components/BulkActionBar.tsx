import React, { memo } from 'react'
import { Check, X, CreditCard, Tags, Archive } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  totalAmount: number
  onMarkAsPaid: () => void
  onMarkAsCanceled: () => void
  onUpdateCategory: () => void
  onClearSelection: () => void
  loading?: boolean
  className?: string
}

export const BulkActionBar = memo(function BulkActionBar({
  selectedCount,
  totalAmount,
  onMarkAsPaid,
  onMarkAsCanceled,
  onUpdateCategory,
  onClearSelection,
  loading = false,
  className = ''
}: BulkActionBarProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className={`
      bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{selectedCount}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {selectedCount} transação{selectedCount > 1 ? 'ões' : ''} selecionada{selectedCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-700">
                Total: {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onMarkAsPaid}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-1" />
            Marcar como pago
          </button>

          <button
            onClick={onUpdateCategory}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Tags className="w-4 h-4 mr-1" />
            Alterar categoria
          </button>

          <button
            onClick={onMarkAsCanceled}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Archive className="w-4 h-4 mr-1" />
            Cancelar
          </button>

          <button
            onClick={onClearSelection}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar seleção
          </button>
        </div>
      </div>
    </div>
  )
})