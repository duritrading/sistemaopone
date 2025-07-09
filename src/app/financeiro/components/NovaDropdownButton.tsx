// src/app/financeiro/components/NovaDropdownButton.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Building, Tag, Folder, CreditCard } from 'lucide-react'

interface NovaDropdownButtonProps {
  onNovoFornecedor: () => void
  onNovoCentroCusto: () => void
  onNovaCategoria: () => void
  onNovaContaRecebimento: () => void
}

export function NovaDropdownButton({
  onNovoFornecedor,
  onNovoCentroCusto,
  onNovaCategoria,
  onNovaContaRecebimento
}: NovaDropdownButtonProps) {
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

  const handleMenuClick = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg transform hover:scale-105"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nova
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <button
            onClick={() => handleMenuClick(onNovoFornecedor)}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Building className="w-4 h-4 mr-3 text-gray-500" />
            Novo Fornecedor
          </button>
          
          <button
            onClick={() => handleMenuClick(onNovoCentroCusto)}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Tag className="w-4 h-4 mr-3 text-gray-500" />
            Novo Centro de Custo
          </button>
          
          <button
            onClick={() => handleMenuClick(onNovaCategoria)}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Folder className="w-4 h-4 mr-3 text-gray-500" />
            Nova Categoria
          </button>
          
          <button
            onClick={() => handleMenuClick(onNovaContaRecebimento)}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-4 h-4 mr-3 text-gray-500" />
            Nova Conta de Recebimento
          </button>
        </div>
      )}
    </div>
  )
}