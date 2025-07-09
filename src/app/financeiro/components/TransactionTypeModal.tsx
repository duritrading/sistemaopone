// src/app/financeiro/components/TransactionTypeModal.tsx
'use client'

import { X, TrendingUp, TrendingDown } from 'lucide-react'

interface TransactionTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectReceita: () => void
  onSelectDespesa: () => void
}

export default function TransactionTypeModal({
  isOpen,
  onClose,
  onSelectReceita,
  onSelectDespesa
}: TransactionTypeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nova Transação</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Escolha o tipo de transação que deseja criar:
          </p>

          <div className="space-y-3">
            {/* Nova Receita */}
            <button
              onClick={onSelectReceita}
              className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Nova Receita</h3>
                  <p className="text-sm text-gray-600">Registrar entrada de dinheiro</p>
                </div>
              </div>
            </button>

            {/* Nova Despesa */}
            <button
              onClick={onSelectDespesa}
              className="w-full p-4 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Nova Despesa</h3>
                  <p className="text-sm text-gray-600">Registrar saída de dinheiro</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}