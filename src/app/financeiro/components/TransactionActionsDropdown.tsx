// src/app/financeiro/components/TransactionActionsDropdown.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  MoreHorizontal, 
  Check, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Download,
  Clock
} from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'receita' | 'despesa'
  status: 'pendente' | 'recebido' | 'pago' | 'vencido' | 'cancelado'
}

interface TransactionActionsDropdownProps {
  transaction: Transaction
  onMarkAsPaid: () => void
  onMarkAsPending: () => void
  onEdit: () => void
  onDelete: () => void
  onView?: () => void
  onDuplicate?: () => void
  onDownload?: () => void
}

export default function TransactionActionsDropdown({
  transaction,
  onMarkAsPaid,
  onMarkAsPending,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onDownload
}: TransactionActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const canMarkAsPaid = transaction.status === 'pendente'
  const canMarkAsPending = transaction.status === 'recebido' || transaction.status === 'pago'
  const isPaid = ['recebido', 'pago'].includes(transaction.status)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        title="Mais ações"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[60] transform">
          {/* Marcar como pago/recebido */}
          {canMarkAsPaid && (
            <button
              onClick={() => handleAction(onMarkAsPaid)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
            >
              <Check className="w-4 h-4 mr-3 text-green-500" />
              Marcar como {transaction.type === 'receita' ? 'Recebido' : 'Pago'}
            </button>
          )}

          {/* Marcar como pendente */}
          {canMarkAsPending && (
            <button
              onClick={() => handleAction(onMarkAsPending)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
            >
              <Clock className="w-4 h-4 mr-3 text-yellow-500" />
              Marcar como Pendente
            </button>
          )}

          {/* Visualizar */}
          {onView && (
            <button
              onClick={() => handleAction(onView)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
            >
              <Eye className="w-4 h-4 mr-3 text-blue-500" />
              Visualizar
            </button>
          )}

          {/* Editar */}
          <button
            onClick={() => handleAction(onEdit)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
          >
            <Edit className="w-4 h-4 mr-3 text-blue-500" />
            Editar
          </button>

          {/* Duplicar */}
          {onDuplicate && (
            <button
              onClick={() => handleAction(onDuplicate)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
            >
              <Copy className="w-4 h-4 mr-3 text-purple-500" />
              Duplicar
            </button>
          )}

          {/* Download anexos */}
          {onDownload && (
            <button
              onClick={() => handleAction(onDownload)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
            >
              <Download className="w-4 h-4 mr-3 text-indigo-500" />
              Download Anexos
            </button>
          )}

          {/* Separador */}
          <div className="border-t border-gray-100 my-1" />

          {/* Excluir */}
          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Excluir
          </button>
        </div>
      )}
    </div>
  )
}