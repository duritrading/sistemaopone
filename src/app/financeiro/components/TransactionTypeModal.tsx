// src/app/financeiro/components/TransactionTypeModal.tsx - VERSÃO LIMPA
'use client'

import { X, TrendingUp, TrendingDown } from 'lucide-react'

interface TransactionTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onReceitaSelect: () => void
  onDespesaSelect: () => void
}

export default function TransactionTypeModal({
  isOpen,
  onClose,
  onReceitaSelect,
  onDespesaSelect
}: TransactionTypeModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-[101]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nova Transação</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Selecione o tipo de transação que deseja criar:
          </p>

          <div className="space-y-4">
            {/* Nova Receita */}
            <button
              onClick={onReceitaSelect}
              className="w-full p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Nova Receita</h3>
                  <p className="text-sm text-gray-600">Registrar entrada de dinheiro</p>
                </div>
              </div>
            </button>

            {/* Nova Despesa */}
            <button
              onClick={onDespesaSelect}
              className="w-full p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Nova Despesa</h3>
                  <p className="text-sm text-gray-600">Registrar saída de dinheiro</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}