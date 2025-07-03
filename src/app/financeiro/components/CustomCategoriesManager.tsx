// src/app/financeiro/components/CustomCategoriesManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Edit2, Trash2, Tag, X, Check, AlertCircle } from 'lucide-react'
import { useToast } from './Toast'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CustomCategory {
  id: string
  name: string
  type: 'receita' | 'despesa'
  color: string
  icon: string
  description?: string
  is_active: boolean
  created_at: string
}

interface CustomCategoriesManagerProps {
  onClose: () => void
  onCategoryUpdate: () => void
}

export function CustomCategoriesManager({ onClose, onCategoryUpdate }: CustomCategoriesManagerProps) {
  const [categories, setCategories] = useState<CustomCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null)
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    type: 'receita' as 'receita' | 'despesa',
    color: '#3b82f6',
    icon: 'tag',
    description: ''
  })

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316',
    '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'
  ]

  const predefinedIcons = [
    'tag', 'dollar-sign', 'shopping-cart', 'home', 'car', 'utensils',
    'laptop', 'heart', 'briefcase', 'graduation-cap', 'plane', 'gift'
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar categorias personalizadas'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showToast({
        type: 'warning',
        title: 'Atenção',
        message: 'Nome da categoria é obrigatório'
      })
      return
    }

    try {
      if (editingCategory) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('custom_categories')
          .update({
            name: formData.name.trim(),
            type: formData.type,
            color: formData.color,
            icon: formData.icon,
            description: formData.description.trim() || null
          })
          .eq('id', editingCategory.id)

        if (error) throw error

        showToast({
          type: 'success',
          title: 'Sucesso',
          message: 'Categoria atualizada com sucesso!'
        })
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('custom_categories')
          .insert([{
            name: formData.name.trim(),
            type: formData.type,
            color: formData.color,
            icon: formData.icon,
            description: formData.description.trim() || null,
            is_active: true
          }])

        if (error) throw error

        showToast({
          type: 'success',
          title: 'Sucesso',
          message: 'Categoria criada com sucesso!'
        })
      }

      resetForm()
      fetchCategories()
      onCategoryUpdate()
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao salvar categoria: ' + err.message
      })
    }
  }

  const handleEdit = (category: CustomCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      description: category.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      showToast({
        type: 'success',
        title: 'Sucesso',
        message: 'Categoria excluída com sucesso!'
      })

      fetchCategories()
      onCategoryUpdate()
    } catch (err: any) {
      console.error('Erro ao excluir categoria:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao excluir categoria: ' + err.message
      })
    }
  }

  const toggleActive = async (categoryId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('custom_categories')
        .update({ is_active: !isActive })
        .eq('id', categoryId)

      if (error) throw error

      fetchCategories()
      onCategoryUpdate()
    } catch (err: any) {
      console.error('Erro ao alterar status da categoria:', err)
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao alterar status da categoria'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'receita',
      color: '#3b82f6',
      icon: 'tag',
      description: ''
    })
    setEditingCategory(null)
    setShowForm(false)
  }

  const getIconElement = (iconName: string, className: string = 'w-4 h-4') => {
    const icons: Record<string, any> = {
      'tag': Tag,
      'dollar-sign': Tag, // Fallback
      'shopping-cart': Tag,
      'home': Tag,
      'car': Tag,
      'utensils': Tag,
      'laptop': Tag,
      'heart': Tag,
      'briefcase': Tag,
      'graduation-cap': Tag,
      'plane': Tag,
      'gift': Tag
    }
    
    const IconComponent = icons[iconName] || Tag
    return <IconComponent className={className} />
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full mx-4 h-[600px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando categorias...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Categorias Personalizadas</h2>
              <p className="text-sm text-gray-500">Gerencie suas categorias de receitas e despesas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories List */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">
                Suas Categorias ({categories.length})
              </h3>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Categoria</span>
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria personalizada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comece criando sua primeira categoria personalizada.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Categoria
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`border rounded-lg p-4 ${
                      category.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          {getIconElement(category.icon)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{category.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleActive(category.id, category.is_active)}
                          className={`p-1 rounded ${
                            category.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={category.is_active ? 'Desativar' : 'Ativar'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Panel */}
          {showForm && (
            <div className="w-80 border-l border-gray-200 bg-gray-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </h4>
                  <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Marketing Digital"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'receita' | 'despesa' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor *</label>
                    <div className="grid grid-cols-6 gap-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ícone *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {predefinedIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon }))}
                          className={`p-2 rounded-lg border text-center ${
                            formData.icon === icon 
                              ? 'border-blue-500 bg-blue-50 text-blue-600' 
                              : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {getIconElement(icon)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descrição opcional da categoria"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 text-sm"
                    >
                      {editingCategory ? 'Atualizar' : 'Criar'} Categoria
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-200 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}