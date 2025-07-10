// src/app/financeiro/components/NovaCategoriaModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, 
  Save, 
  Folder, 
  TrendingUp,
  TrendingDown,
  Tag,
  Info,
  Palette
} from 'lucide-react'

interface NovaCategoriaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: any
}

interface CategoryFormData {
  name: string
  type: 'receita' | 'despesa'
  description: string
  parent_category_id: string
  color: string
  icon: string
  is_active: boolean
  notes: string
}

export default function NovaCategoriaModal({
  isOpen,
  onClose,
  onSuccess,
  editData
}: NovaCategoriaModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'despesa',
    description: '',
    parent_category_id: '',
    color: '#3B82F6',
    icon: 'folder',
    is_active: true,
    notes: ''
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        type: editData.type || 'despesa',
        description: editData.description || '',
        parent_category_id: editData.parent_category_id || '',
        color: editData.color || '#3B82F6',
        icon: editData.icon || 'folder',
        is_active: editData.is_active ?? true,
        notes: editData.notes || ''
      })
    } else {
      // Reset form for new category
      setFormData({
        name: '',
        type: 'despesa',
        description: '',
        parent_category_id: '',
        color: '#3B82F6',
        icon: 'folder',
        is_active: true,
        notes: ''
      })
    }
  }, [editData])

  if (!isOpen) return null

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ]

  const iconOptions = [
    { value: 'folder', label: 'Pasta', icon: '📁' },
    { value: 'shopping-cart', label: 'Compras', icon: '🛒' },
    { value: 'car', label: 'Transporte', icon: '🚗' },
    { value: 'home', label: 'Casa', icon: '🏠' },
    { value: 'laptop', label: 'Tecnologia', icon: '💻' },
    { value: 'heart', label: 'Saúde', icon: '❤️' },
    { value: 'book', label: 'Educação', icon: '📚' },
    { value: 'coffee', label: 'Alimentação', icon: '☕' },
    { value: 'users', label: 'Pessoal', icon: '👥' },
    { value: 'briefcase', label: 'Trabalho', icon: '💼' }
  ]

  const handleInputChange = (field: keyof CategoryFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        ...formData,
        parent_category_id: formData.parent_category_id || null,
        updated_at: new Date().toISOString()
      }

      if (editData) {
        // Update existing category
        const { error } = await supabase
          .from('custom_categories')
          .update(categoryData)
          .eq('id', editData.id)

        if (error) throw error
      } else {
        // Create new category
        const { error } = await supabase
          .from('custom_categories')
          .insert([{
            ...categoryData,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err)
      alert(`Erro ao ${editData ? 'atualizar' : 'criar'} categoria: ${err.message}`)
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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editData ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <p className="text-sm text-gray-600">
                {editData ? 'Atualize as informações da categoria' : 'Crie uma nova categoria para organizar suas transações'}
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
            {/* Nome da Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Categoria *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Folder className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-700 focus:border-transparent"
                  placeholder="Ex: Marketing Digital, Hospedagem, Vendas Online"
                  required
                />
              </div>
            </div>

            {/* Tipo de Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Categoria *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="radio"
                    id="receita"
                    name="type"
                    value="receita"
                    checked={formData.type === 'receita'}
                    onChange={(e) => handleInputChange('type', e.target.value as 'receita' | 'despesa')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="receita"
                    className={`block w-full p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'receita'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-6 h-6" />
                      <div>
                        <p className="font-medium">Receita</p>
                        <p className="text-sm text-gray-600">Entradas de dinheiro</p>
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <input
                    type="radio"
                    id="despesa"
                    name="type"
                    value="despesa"
                    checked={formData.type === 'despesa'}
                    onChange={(e) => handleInputChange('type', e.target.value as 'receita' | 'despesa')}
                    className="sr-only"
                  />
                  <label
                    htmlFor="despesa"
                    className={`block w-full p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'despesa'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="w-6 h-6" />
                      <div>
                        <p className="font-medium">Despesa</p>
                        <p className="text-sm text-gray-600">Saídas de dinheiro</p>
                      </div>
                    </div>
                  </label>
                </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-700 focus:border-transparent"
                placeholder="Descreva o que essa categoria representa..."
              />
            </div>

            {/* Cor da Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cor da Categoria
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleInputChange('color', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color 
                          ? 'border-gray-800 scale-110' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ícone da Categoria
              </label>
              <div className="grid grid-cols-5 gap-3">
                {iconOptions.map((iconOption) => (
                  <button
                    key={iconOption.value}
                    type="button"
                    onClick={() => handleInputChange('icon', iconOption.value)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      formData.icon === iconOption.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-xl mb-1">{iconOption.icon}</div>
                    <div className="text-xs text-gray-600">{iconOption.label}</div>
                  </button>
                ))}
              </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-700 focus:border-transparent"
                placeholder="Informações adicionais sobre esta categoria..."
              />
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Categoria ativa
              </label>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visualização da Categoria
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: formData.color }}
                  >
                    <span className="text-white text-sm">
                      {iconOptions.find(icon => icon.value === formData.icon)?.icon || '📁'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {formData.name || 'Nome da categoria'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formData.description || 'Descrição da categoria'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formData.type === 'receita' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.type === 'receita' ? 'Receita' : 'Despesa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações de Ajuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Dica: Organizando Categorias</h3>
                  <p className="text-sm text-blue-700">
                    Use categorias específicas para melhor controle financeiro. Por exemplo, ao invés de apenas 
                    "Despesas", crie "Marketing Digital", "Marketing Tradicional", etc. Isso facilita relatórios 
                    detalhados e análises de gastos por área.
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : (editData ? 'Atualizar' : 'Salvar')} Categoria
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}