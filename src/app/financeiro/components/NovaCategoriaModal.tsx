// src/app/financeiro/components/NovaCategoriaModal.tsx
'use client'

import { useState } from 'react'
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
  onSuccess
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
    { value: 'plane', label: 'Viagem', icon: '✈️' },
    { value: 'dollar-sign', label: 'Financeiro', icon: '💰' },
    { value: 'users', label: 'Pessoas', icon: '👥' },
    { value: 'building', label: 'Empresa', icon: '🏢' }
  ]

  const commonCategories = {
    receita: [
      'Receitas de Serviços',
      'Receitas de Produtos',
      'Receitas de Vendas',
      'Receitas Financeiras',
      'Outras Receitas'
    ],
    despesa: [
      'Despesas Operacionais',
      'Despesas Administrativas',
      'Despesas com Pessoal',
      'Despesas de Marketing',
      'Despesas de Tecnologia',
      'Despesas Financeiras',
      'Impostos e Taxas',
      'Aluguel e Utilidades',
      'Viagens e Hospedagem',
      'Material de Escritório'
    ]
  }

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
      const { error } = await supabase
        .from('custom_categories')
        .insert([{
          ...formData,
          parent_category_id: formData.parent_category_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao criar categoria:', err)
      alert('Erro ao criar categoria: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectPredefinedCategory = (categoryName: string) => {
    handleInputChange('name', categoryName)
    handleInputChange('description', `Categoria para ${categoryName.toLowerCase()}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nova Categoria</h2>
              <p className="text-sm text-gray-600">Crie uma nova categoria para organizar suas transações</p>
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
          {/* Tipo de Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Categoria *</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleInputChange('type', 'receita')}
                className={`flex items-center px-6 py-3 rounded-lg border ${
                  formData.type === 'receita'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Receita
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('type', 'despesa')}
                className={`flex items-center px-6 py-3 rounded-lg border ${
                  formData.type === 'despesa'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Despesa
              </button>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Categoria *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
                placeholder="Ex: Despesas de Marketing"
              />
            </div>

            {/* Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
              <select
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
              >
                {iconOptions.map(icon => (
                  <option key={icon.value} value={icon.value}>
                    {icon.icon} {icon.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <div className="flex space-x-1">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleInputChange('color', color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-600' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Categoria Pai */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria Pai (Opcional)</label>
              <select
                value={formData.parent_category_id}
                onChange={(e) => handleInputChange('parent_category_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
              >
                <option value="">Nenhuma (Categoria raiz)</option>
                {/* TODO: Buscar categorias existentes do Supabase */}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Para criar uma hierarquia, selecione a categoria pai
              </p>
            </div>
          </div>

          {/* Categorias Sugeridas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Categorias Sugeridas para {formData.type === 'receita' ? 'Receitas' : 'Despesas'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {commonCategories[formData.type].map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => selectPredefinedCategory(category)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">{category}</span>
                </button>
              ))}
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
              placeholder="Descreva que tipos de transações devem usar esta categoria..."
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações Adicionais</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:border-transparent"
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
              <span className="ml-2 text-sm text-gray-700">Categoria ativa</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Categorias inativas não aparecerão nas opções de seleção
            </p>
          </div>

          {/* Preview da Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Preview da Categoria</label>
            <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: formData.color }}
              >
                {iconOptions.find(icon => icon.value === formData.icon)?.icon || '📁'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {formData.name || 'Nome da categoria'}
                </p>
                <p className="text-sm text-gray-500">
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
            {loading ? 'Salvando...' : 'Salvar Categoria'}
          </button>
        </div>
      </div>
    </div>
  )
}