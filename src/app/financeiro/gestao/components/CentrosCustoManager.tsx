// src/app/financeiro/gestao/components/CentrosCustoManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Target, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  DollarSign,
  Tag,
  Building,
  AlertCircle,
  TrendingUp,
  X,
  Save
} from 'lucide-react'

interface CostCenter {
  id: string
  name: string
  code?: string
  description?: string
  category?: string
  responsible_person?: string
  budget_limit?: number
  parent_cost_center_id?: string
  is_active: boolean
  created_at: string
  // Dados calculados
  used_budget?: number
  transactions_count?: number
}

interface CentrosCustoManagerProps {
  onUpdate: () => void
}

export default function CentrosCustoManager({ onUpdate }: CentrosCustoManagerProps) {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const categories = [
    'administrativo',
    'comercial', 
    'operacional',
    'tecnologia',
    'marketing',
    'recursos_humanos',
    'financeiro',
    'projetos'
  ]

  useEffect(() => {
    loadCostCenters()
  }, [])

  const loadCostCenters = async () => {
    try {
      setLoading(true)
      
      // Carregar centros de custo com dados de uso
      const { data: costCentersData, error: costCentersError } = await supabase
        .from('cost_centers')
        .select('*')
        .order('name')

      if (costCentersError) throw costCentersError

      // Calcular uso do orçamento para cada centro de custo
      const costCentersWithUsage = await Promise.all(
        (costCentersData || []).map(async (center) => {
          const { data: transactions, error: transError } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('cost_center_id', center.id)
            .eq('type', 'despesa')
            .in('status', ['pago', 'pendente'])

          if (transError) {
            console.error('Erro ao carregar transações:', transError)
            return {
              ...center,
              used_budget: 0,
              transactions_count: 0
            }
          }

          const usedBudget = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
          
          return {
            ...center,
            used_budget: usedBudget,
            transactions_count: transactions?.length || 0
          }
        })
      )

      setCostCenters(costCentersWithUsage)
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCostCenters = costCenters.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.responsible_person?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && center.is_active) ||
                         (statusFilter === 'inactive' && !center.is_active)
    
    const matchesCategory = categoryFilter === 'all' || center.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleToggleStatus = async (center: CostCenter) => {
    try {
      const { error } = await supabase
        .from('cost_centers')
        .update({ is_active: !center.is_active })
        .eq('id', center.id)

      if (error) throw error

      await loadCostCenters()
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do centro de custo')
    }
  }

  const handleDelete = async (center: CostCenter) => {
    if (!confirm(`Tem certeza que deseja excluir o centro de custo "${center.name}"?`)) {
      return
    }

    try {
      // Verificar se há transações vinculadas
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('cost_center_id', center.id)
        .limit(1)

      if (transactions && transactions.length > 0) {
        alert('Não é possível excluir este centro de custo pois há transações vinculadas a ele.')
        return
      }

      const { error } = await supabase
        .from('cost_centers')
        .delete()
        .eq('id', center.id)

      if (error) throw error

      await loadCostCenters()
      onUpdate()
      alert('Centro de custo excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir centro de custo:', error)
      alert('Erro ao excluir centro de custo.')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getBudgetStatus = (center: CostCenter) => {
    if (!center.budget_limit || center.budget_limit <= 0) {
      return { status: 'no-limit', color: 'text-gray-500', label: 'Sem limite' }
    }

    const usedPercentage = ((center.used_budget || 0) / center.budget_limit) * 100

    if (usedPercentage >= 100) {
      return { status: 'exceeded', color: 'text-red-600', label: 'Excedido' }
    } else if (usedPercentage >= 80) {
      return { status: 'warning', color: 'text-yellow-600', label: 'Atenção' }
    } else {
      return { status: 'ok', color: 'text-green-600', label: 'Normal' }
    }
  }

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      administrativo: 'Administrativo',
      comercial: 'Comercial',
      operacional: 'Operacional',
      tecnologia: 'Tecnologia',
      marketing: 'Marketing',
      recursos_humanos: 'RH',
      financeiro: 'Financeiro',
      projetos: 'Projetos'
    }
    return category ? labels[category] || category : 'Não definido'
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
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar centros de custo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="active">Apenas ativos</option>
            <option value="inactive">Apenas inativos</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {filteredCostCenters.length} de {costCenters.length} centros de custo
        </div>
      </div>

      {/* Cost Centers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Centro de Custo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orçamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCostCenters.map((center) => {
                const budgetStatus = getBudgetStatus(center)
                
                return (
                  <tr key={center.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Target className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {center.name}
                          </div>
                          {center.code && (
                            <div className="text-sm text-gray-500">
                              Código: {center.code}
                            </div>
                          )}
                          {center.description && (
                            <div className="text-xs text-gray-400 max-w-xs truncate">
                              {center.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryLabel(center.category)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {center.responsible_person ? (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-400" />
                          {center.responsible_person}
                        </div>
                      ) : (
                        <span className="text-gray-400">Não definido</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {center.budget_limit ? (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                          {formatCurrency(center.budget_limit)}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sem limite</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-medium ${budgetStatus.color}`}>
                          {formatCurrency(center.used_budget || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {center.transactions_count} transações
                        </div>
                        {center.budget_limit && center.budget_limit > 0 && (
                          <div className="text-xs text-gray-400">
                            {(((center.used_budget || 0) / center.budget_limit) * 100).toFixed(1)}% usado
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(center)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          center.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {center.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCostCenter(center)
                            setShowDetailsModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedCostCenter(center)
                            setShowEditModal(true)
                          }}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(center)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredCostCenters.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum centro de custo encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro centro de custo.'}
            </p>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orçamento Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(costCenters.reduce((sum, c) => sum + (c.budget_limit || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usado</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(costCenters.reduce((sum, c) => sum + (c.used_budget || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disponível</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(
                  costCenters.reduce((sum, c) => sum + (c.budget_limit || 0), 0) -
                  costCenters.reduce((sum, c) => sum + (c.used_budget || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedCostCenter && (
        <CostCenterDetailsModal
          costCenter={selectedCostCenter}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedCostCenter(null)
          }}
        />
      )}

      {showEditModal && selectedCostCenter && (
        <CostCenterEditModal
          costCenter={selectedCostCenter}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCostCenter(null)
          }}
          onSuccess={() => {
            loadCostCenters()
            onUpdate()
            setShowEditModal(false)
            setSelectedCostCenter(null)
          }}
        />
      )}
    </div>
  )
}

// Modal de detalhes (placeholder)
function CostCenterDetailsModal({ costCenter, onClose }: { costCenter: CostCenter; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Detalhes do Centro de Custo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p>Modal de detalhes para: {costCenter.name}</p>
          {/* Implementar detalhes completos */}
        </div>
      </div>
    </div>
  )
}

// Modal de edição (placeholder)
function CostCenterEditModal({ 
  costCenter, 
  onClose, 
  onSuccess 
}: { 
  costCenter: CostCenter
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Editar Centro de Custo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p>Modal de edição para: {costCenter.name}</p>
          {/* Implementar formulário de edição */}
        </div>
      </div>
    </div>
  )
}