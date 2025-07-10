// src/app/financeiro/components/DateFilterDropdown.tsx - VERSÃO SIMPLIFICADA
'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'

interface DateFilter {
  year?: number
  month?: number
  startDate?: string
  endDate?: string
}

interface DateFilterDropdownProps {
  value: DateFilter
  onChange: (filter: DateFilter) => void
}

export default function DateFilterDropdown({ value, onChange }: DateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempFilter, setTempFilter] = useState<DateFilter>(value)
  const [filterType, setFilterType] = useState<'all' | 'year' | 'month' | 'custom'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]

  const getFilterLabel = () => {
    if (value.year && value.month) {
      const monthLabel = months.find(m => m.value === value.month)?.label
      return `${monthLabel} ${value.year}`
    }
    if (value.year) {
      return `Ano: ${value.year}`
    }
    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate).toLocaleDateString('pt-BR')
      const end = new Date(value.endDate).toLocaleDateString('pt-BR')
      return `${start} - ${end}`
    }
    return 'Período'
  }

  const handleApply = () => {
    switch (filterType) {
      case 'all':
        onChange({})
        break
      case 'year':
        onChange({ year: tempFilter.year })
        break
      case 'month':
        onChange({ year: tempFilter.year, month: tempFilter.month })
        break
      case 'custom':
        onChange({ startDate: tempFilter.startDate, endDate: tempFilter.endDate })
        break
    }
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilterType('all')
    setTempFilter({})
    onChange({})
    setIsOpen(false)
  }

  const handleTypeChange = (type: typeof filterType) => {
    setFilterType(type)
    
    if (type === 'year') {
      setTempFilter({ year: currentYear })
    } else if (type === 'month') {
      setTempFilter({ year: currentYear, month: new Date().getMonth() + 1 })
    } else if (type === 'custom') {
      const today = new Date().toISOString().split('T')[0]
      const firstDay = new Date(currentYear, new Date().getMonth(), 1).toISOString().split('T')[0]
      setTempFilter({ startDate: firstDay, endDate: today })
    } else {
      setTempFilter({})
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white w-full justify-between"
      >
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {getFilterLabel()}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filtrar por período</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tipo de filtro */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de filtro
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTypeChange('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => handleTypeChange('year')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === 'year'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ano
              </button>
              <button
                onClick={() => handleTypeChange('month')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === 'month'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => handleTypeChange('custom')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === 'custom'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Período customizado
              </button>
            </div>
          </div>

          {/* Filtros específicos */}
          {filterType === 'year' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select
                value={tempFilter.year || ''}
                onChange={(e) => setTempFilter({ ...tempFilter, year: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'month' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano
                </label>
                <select
                  value={tempFilter.year || ''}
                  onChange={(e) => setTempFilter({ ...tempFilter, year: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <select
                  value={tempFilter.month || ''}
                  onChange={(e) => setTempFilter({ ...tempFilter, month: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {filterType === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={tempFilter.startDate || ''}
                  onChange={(e) => setTempFilter({ ...tempFilter, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data final
                </label>
                <input
                  type="date"
                  value={tempFilter.endDate || ''}
                  onChange={(e) => setTempFilter({ ...tempFilter, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Limpar
            </button>
            <div className="space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}