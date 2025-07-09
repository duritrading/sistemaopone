// src/app/financeiro/gestao/components/CategoriasManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Tag, 
  Search, 
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react'

interface CategoriasManagerProps {
  onUpdate: () => void
}

export default function CategoriasManager({ onUpdate }: CategoriasManagerProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all')
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select(`
          *,
          parent_category:parent_category_id(name)
        `)
        .order('type')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || category.type === typeFilter

    return matchesSearch && matchesType
  })

  const toggleStatus = async (category: any) => {
    try {
      const { error } = await supabase
        .from('custom_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error
      await loadCategories()
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status da categoria')
    }
  }

  const handleDelete = async (category: any) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      return
    }

    try {
      // Verificar se há transações ou subcategorias vinculadas
      const [transactionsRes, childrenRes] = await Promise.all([
        supabase.from('financial_transactions').select('id').eq('category', category.name).limit(1),
        supabase.from('custom_categories').select('id').eq('parent_category_id', category.id).limit(1)
      ])

      if (transactionsRes.data && transactionsRes.data.length > 0) {
        alert('Não é possível excluir esta categoria pois há transações vinculadas a ela.')
        return
      }

      if (childrenRes.data && childrenRes.data.length > 0) {
        alert('Não é possível excluir esta categoria pois há subcategorias vinculadas a ela.')
        return
      }

      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', category.id)

      if (error) throw error

      await loadCategories()
      onUpdate()
      alert('Categoria excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria.')
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'receita' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> :
      <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const getTypeColor = (type: string) => {
    return type === 'receita' ? 
      'bg-green-100 text-green-800' :
      'bg-red-100 text-red-800'
  }

  const renderIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'folder': Tag,
      'shopping-cart': Tag,
      'car': Tag,
      'home': Tag,
      'laptop': Tag,
      'heart': Tag,
      'book': Tag,
      'coffee': Tag,
      'plane': Tag,
      'gift': Tag
    }
    const IconComponent = iconMap[iconName] || Tag
    return <IconComponent className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>

        <div className="text-sm text-gray-700">
          {filteredCategories.length} de {categories.length} categorias
        </div>
      </div>

      {/* Categories Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Receitas</p>
              <p className="text-xl font-semibold text-gray-900">
                {categories.filter(c => c.type === 'receita').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Despesas</p>
              <p className="text-xl font-semibold text-gray-900">
                {categories.filter(c => c.type === 'despesa').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Ativas</p>
              <p className="text-xl font-semibold text-gray-900">
                {categories.filter(c => c.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-gray-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Categoria Pai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <div style={{ color: category.color }}>
                            {renderIcon(category.icon || 'folder')}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="flex items-center mt-1">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-xs text-gray-500">
                            {category.icon || 'folder'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(category.type)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
                        {category.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {category.description || 'Sem descrição'}
                    </div>
                    {category.notes && (
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                        {category.notes}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {category.parent_category?.name || 'Categoria raiz'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(category)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {category.is_active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedCategory(category)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button className="text-yellow-600 hover:text-yellow-900 p-1" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-900 p-1" 
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria encontrada</h3>
            <p className="mt-1 text-sm text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira categoria personalizada.'}
            </p>
          </div>
        )}
      </div>

      {/* Category Details Modal */}
      {showDetailsModal && selectedCategory && (
        <CategoryDetailsModal
          category={selectedCategory}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedCategory(null)
          }}
        />
      )}
    </div>
  )
}

// Modal de detalhes da categoria
function CategoryDetailsModal({ category, onClose }: { category: any; onClose: () => void }) {
  const renderIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'folder': Tag,
      'shopping-cart': Tag,
      'car': Tag,
      'home': Tag,
      'laptop': Tag,
      'heart': Tag,
      'book': Tag,
      'coffee': Tag,
      'plane': Tag,
      'gift': Tag
    }
    const IconComponent = iconMap[iconName] || Tag
    return <IconComponent className="w-6 h-6" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <div style={{ color: category.color }}>
                {renderIcon(category.icon || 'folder')}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
              <p className="text-sm text-gray-600">
                {category.type === 'receita' ? 'Categoria de Receita' : 'Categoria de Despesa'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <div className="flex items-center">
                {category.type === 'receita' ? 
                  <TrendingUp className="w-4 h-4 text-green-600 mr-2" /> :
                  <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                }
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  category.type === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {category.type === 'receita' ? 'Receita' : 'Despesa'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {category.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm text-gray-600">{category.color}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
              <div className="flex items-center space-x-2">
                <div style={{ color: category.color }}>
                  {renderIcon(category.icon || 'folder')}
                </div>
                <span className="text-sm text-gray-600">{category.icon || 'folder'}</span>
              </div>
            </div>
          </div>

          {category.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {category.description}
              </p>
            </div>
          )}

          {category.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {category.notes}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <label className="block font-medium mb-1">Criado em</label>
              <span>{new Date(category.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div>
              <label className="block font-medium mb-1">Atualizado em</label>
              <span>{new Date(category.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}