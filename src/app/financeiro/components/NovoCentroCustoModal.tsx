// src/app/financeiro/components/NovoCentroCustoModal.tsx
'use client'

import { useState } from 'react'
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
  onSuccess
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
      const { error } = await supabase
        .from('cost_centers')
        .insert([{
          ...formData,
          budget_limit: formData.budget_limit || null,
          parent_cost_center_id: formData.parent_cost_center_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao criar centro de custo:', err)
      alert('Erro ao criar centro de custo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateCode = () => {
    if (formData.name && formData.category) {
      const nameCode = formData.name.substring(0, 3).toUpperCase()
      const categoryCode = formData.category.substring(0, 3).toUpperCase()
      const randomNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0')
      const code = `${categoryCode}-${nameCode}-${randomNumber}`
      handleInputChange('code', code)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Novo Centro de Custo</h2>
              <p className="text-sm text-gray-600">Cadastre um novo centro de custo para organização financeira</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Centro de Custo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Marketing Digital, TI Infraestrutura"
                />
              </div>

              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código *</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: MKT-DIG-01"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Gerar
                  </button>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Responsável</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={formData.responsible_person}
                    onChange={(e) => handleInputChange('responsible_person', e.target.value)}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>

              {/* Limite de Orçamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Limite de Orçamento (Opcional)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budget_limit || ''}
                    onChange={(e) => handleInputChange('budget_limit', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Centro de Custo Pai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Centro de Custo Pai (Opcional)</label>
                <select
                  value={formData.parent_cost_center_id}
                  onChange={(e) => handleInputChange('parent_cost_center_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Nenhum (Centro de custo raiz)</option>
                  {/* TODO: Buscar centros de custo existentes do Supabase */}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Para criar uma hierarquia, selecione o centro de custo pai
                </p>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva o objetivo e escopo deste centro de custo..."
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações Adicionais</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Informações adicionais, regras especiais, etc..."
              />
            </div>

            {/* Status Ativo */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Centro de custo ativo</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Centros de custo inativos não aparecerão nas opções de seleção
              </p>
            </div>
          </div>

          {/* Informações de Ajuda */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Target className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Dica: Como usar Centros de Custo</h3>
                <p className="text-sm text-blue-700">
                  Os centros de custo ajudam a organizar suas despesas por departamento, projeto ou área. 
                  Use códigos padronizados para facilitar relatórios e análises financeiras.
                </p>
              </div>
            </div>
          </div>
        </form>

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
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Centro de Custo'}
          </button>
        </div>
      </div>
    </div>
  )
}