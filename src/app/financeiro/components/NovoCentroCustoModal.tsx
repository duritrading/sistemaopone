// src/app/financeiro/components/NovoCentroCustoModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, 
  Save, 
  Tag, 
  User,
  Target,
  Building,
  DollarSign
} from 'lucide-react'

interface NovoCentroCustoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

interface CostCenterFormData {
  name: string
  code: string
  description: string
  category: string
  responsible_person: string
  budget_limit: number
  parent_cost_center_id: string
  is_active: boolean
  notes: string
}

export default function NovoCentroCustoModal({
  isOpen,
  onClose,
  onSuccess,
  editData
}: NovoCentroCustoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CostCenterFormData>({
    name: '',
    code: '',
    description: '',
    category: '',
    responsible_person: '',
    budget_limit: 0,
    parent_cost_center_id: '',
    is_active: true,
    notes: ''
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        code: editData.code || '',
        description: editData.description || '',
        category: editData.category || '',
        responsible_person: editData.responsible_person || '',
        budget_limit: editData.budget_limit || 0,
        parent_cost_center_id: editData.parent_cost_center_id || '',
        is_active: editData.is_active ?? true,
        notes: editData.notes || ''
      })
    } else {
      // Reset form for new cost center
      setFormData({
        name: '',
        code: '',
        description: '',
        category: '',
        responsible_person: '',
        budget_limit: 0,
        parent_cost_center_id: '',
        is_active: true,
        notes: ''
      })
    }
  }, [editData])

  if (!isOpen) return null

  const categories = [
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'tecnologia', label: 'Tecnologia' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'recursos_humanos', label: 'Recursos Humanos' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'projetos', label: 'Projetos' },
    { value: 'outros', label: 'Outros' }
  ]

  const handleInputChange = (field: keyof CostCenterFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const costCenterData = {
        ...formData,
        budget_limit: formData.budget_limit || null,
        parent_cost_center_id: formData.parent_cost_center_id || null,
        updated_at: new Date().toISOString()
      }

      if (editData) {
        // Update existing cost center
        const { error } = await supabase
          .from('cost_centers')
          .update(costCenterData)
          .eq('id', editData.id)

        if (error) throw error
      } else {
        // Create new cost center
        const { error } = await supabase
          .from('cost_centers')
          .insert([{
            ...costCenterData,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar centro de custo:', err)
      alert(`Erro ao ${editData ? 'atualizar' : 'criar'} centro de custo: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editData ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
              </h2>
              <p className="text-sm text-gray-600">
                {editData ? 'Atualize as informações do centro de custo' : 'Cadastre um novo centro de custo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Nome e Código */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Centro de Custo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-700 focus:border-transparent"
                    placeholder="Ex: Marketing Digital"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-700 focus:border-transparent"
                  placeholder="Ex: MKT-001"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-700 focus:border-transparent"
                placeholder="Descreva a finalidade deste centro de custo..."
              />
            </div>

            {/* Categoria e Responsável */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-700 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.responsible_person}
                    onChange={(e) => handleInputChange('responsible_person', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-700 focus:border-transparent"
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
            </div>

            {/* Limite de Orçamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de Orçamento (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget_limit || ''}
                  onChange={(e) => handleInputChange('budget_limit', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-700 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para não definir limite de orçamento
              </p>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-700 focus:border-transparent"
                placeholder="Informações adicionais..."
              />
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Centro de custo ativo
              </label>
            </div>

            {/* Informação de Ajuda */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <Target className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-purple-800 mb-1">Dica: Organizando Centros de Custo</h3>
                  <p className="text-sm text-purple-700">
                    Use centros de custo para agrupar despesas por departamento, projeto ou atividade. 
                    Isso facilita o controle orçamentário e análise de gastos por área específica.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors inline-flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : (editData ? 'Atualizar' : 'Salvar')} Centro de Custo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}