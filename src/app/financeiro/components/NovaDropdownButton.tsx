// src/app/financeiro/components/NovaDropdownButton.tsx - ATUALIZADO
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Building, Tag, Folder, CreditCard } from 'lucide-react'

type ModalType = 
  | 'transaction'    
  | 'receita'        
  | 'despesa'        
  | 'fornecedor'     
  | 'centro-custo'   
  | 'categoria'      
  | 'conta'

interface NovaDropdownButtonProps {
  onSelect: (type: ModalType) => void
}

export function NovaDropdownButton({ onSelect }: NovaDropdownButtonProps) {
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

  const handleMenuClick = (type: ModalType) => {
    onSelect(type)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nova
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <button
            onClick={() => handleMenuClick('fornecedor')}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Building className="w-4 h-4 mr-3 text-gray-500" />
            <div className="text-left">
              <div className="font-medium">Novo Fornecedor</div>
              <div className="text-xs text-gray-500">Cadastrar empresa ou pessoa física</div>
            </div>
          </button>
          
          <button
            onClick={() => handleMenuClick('centro-custo')}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Tag className="w-4 h-4 mr-3 text-gray-500" />
            <div className="text-left">
              <div className="font-medium">Novo Centro de Custo</div>
              <div className="text-xs text-gray-500">Organizar gastos por departamento</div>
            </div>
          </button>
          
          <button
            onClick={() => handleMenuClick('categoria')}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Folder className="w-4 h-4 mr-3 text-gray-500" />
            <div className="text-left">
              <div className="font-medium">Nova Categoria</div>
              <div className="text-xs text-gray-500">Classificar receitas ou despesas</div>
            </div>
          </button>
          
          <button
            onClick={() => handleMenuClick('conta')}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-4 h-4 mr-3 text-gray-500" />
            <div className="text-left">
              <div className="font-medium">Nova Conta</div>
              <div className="text-xs text-gray-500">Banco, cartão ou conta digital</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}