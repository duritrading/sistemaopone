// src/app/financeiro/gestao/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Building, 
  Tag, 
  CreditCard, 
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Filter,
  X
} from 'lucide-react'
import Link from 'next/link'
import NovoFornecedorModal from '../components/NovoFornecedorModal'
import NovoCentroCustoModal from '../components/NovoCentroCustoModal'
import NovaCategoriaModal from '../components/NovaCategoriaModal'
import NovaContaRecebimentoModal from '../components/NovaContaRecebimentoModal'

interface Supplier {
  id: string
  company_name: string
  trading_name?: string
  email?: string
  phone?: string
  cnpj?: string
  cpf?: string
  person_type: 'juridica' | 'fisica'
  is_active: boolean
  created_at: string
}

interface CostCenter {
  id: string
  name: string
  code?: string
  description?: string
  category?: string
  responsible_person?: string
  budget_limit?: number
  is_active: boolean
  created_at: string
}

interface Category {
  id: string
  name: string
  type: 'receita' | 'despesa'
  color: string
  icon?: string
  description?: string
  is_active: boolean
  created_at: string
}

interface Account {
  id: string
  name: string
  type: string
  bank?: string
  balance: number
  is_active: boolean
  created_at: string
}

type ActiveTab = 'fornecedores' | 'centro-custo' | 'categorias' | 'contas'

export default function GestaoFinanceiraPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('fornecedores')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [showCentroCustoModal, setShowCentroCustoModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showContaModal, setShowContaModal] = useState(false)

  // Edit states
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadSuppliers(),
        loadCostCenters(),
        loadCategories(),
        loadAccounts()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name')
      
      if (error) throw error
      setSuppliers(data || [])
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err)
    }
  }

  const loadCostCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCostCenters(data || [])
    } catch (err) {
      console.error('Erro ao carregar centros de custo:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name')
      
      if (error) throw error
      setAccounts(data || [])
    } catch (err) {
      console.error('Erro ao carregar contas:', err)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTabCounts = () => {
    return {
      fornecedores: suppliers.length,
      'centro-custo': costCenters.length,
      categorias: categories.length,
      contas: accounts.length
    }
  }

  // Delete functions
  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return
    
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadSuppliers()
      alert('Fornecedor excluído com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir fornecedor:', err)
      alert('Erro ao excluir fornecedor')
    }
  }

  const handleDeleteCostCenter = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este centro de custo?')) return
    
    try {
      const { error } = await supabase
        .from('cost_centers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadCostCenters()
      alert('Centro de custo excluído com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir centro de custo:', err)
      alert('Erro ao excluir centro de custo')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    
    try {
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadCategories()
      alert('Categoria excluída com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir categoria:', err)
      alert('Erro ao excluir categoria')
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return
    
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadAccounts()
      alert('Conta excluída com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir conta:', err)
      alert('Erro ao excluir conta')
    }
  }

  // View details functions
  const handleViewSupplier = (supplier: Supplier) => {
    setEditingItem(supplier)
    setShowDetailsModal(true)
  }

  const handleViewCostCenter = (costCenter: CostCenter) => {
    setEditingItem(costCenter)
    setShowDetailsModal(true)
  }

  const handleViewCategory = (category: Category) => {
    setEditingItem(category)
    setShowDetailsModal(true)
  }

  const handleViewAccount = (account: Account) => {
    setEditingItem(account)
    setShowDetailsModal(true)
  }

  const counts = getTabCounts()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando dados...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/financeiro"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Financeiro
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestão Financeira</h1>
                <p className="text-gray-600 mt-1">Configure fornecedores, centros de custo, categorias e contas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('fornecedores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'fornecedores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Fornecedores</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {counts.fornecedores}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('centro-custo')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'centro-custo'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Centro de Custo</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {counts['centro-custo']}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('categorias')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'categorias'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Categorias</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {counts.categorias}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('contas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'contas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Contas</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {counts.contas}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Header com botão de adicionar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'fornecedores' && 'Fornecedores'}
                {activeTab === 'centro-custo' && 'Centros de Custo'}  
                {activeTab === 'categorias' && 'Categorias'}
                {activeTab === 'contas' && 'Contas'}
              </h2>
              <button 
                onClick={() => {
                  if (activeTab === 'fornecedores') setShowFornecedorModal(true)
                  if (activeTab === 'centro-custo') setShowCentroCustoModal(true)
                  if (activeTab === 'categorias') setShowCategoriaModal(true)
                  if (activeTab === 'contas') setShowContaModal(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo {activeTab === 'fornecedores' ? 'Fornecedor' : 
                      activeTab === 'centro-custo' ? 'Centro de Custo' :
                      activeTab === 'categorias' ? 'Categoria' : 'Conta'}
              </button>
            </div>

            {/* Fornecedores Tab */}
            {activeTab === 'fornecedores' && (
              <div className="space-y-4">
                {suppliers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum fornecedor cadastrado</h3>
                    <p className="mt-1 text-sm text-gray-600">Comece criando seu primeiro fornecedor</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((supplier) => (
                      <div key={supplier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{supplier.company_name}</h3>
                            {supplier.trading_name && <p className="text-sm text-gray-600">{supplier.trading_name}</p>}
                            {supplier.email && <p className="text-sm text-gray-600">{supplier.email}</p>}
                            {supplier.phone && <p className="text-sm text-gray-600">{supplier.phone}</p>}
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {supplier.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewSupplier(supplier)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingItem(supplier)
                                setShowFornecedorModal(true)
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Centro de Custo Tab */}
            {activeTab === 'centro-custo' && (
              <div className="space-y-4">
                {costCenters.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum centro de custo cadastrado</h3>
                    <p className="mt-1 text-sm text-gray-600">Comece criando seu primeiro centro de custo</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {costCenters.map((costCenter) => (
                      <div key={costCenter.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{costCenter.name}</h3>
                            {costCenter.code && <p className="text-sm text-gray-600">Código: {costCenter.code}</p>}
                            {costCenter.description && <p className="text-sm text-gray-600">{costCenter.description}</p>}
                            {costCenter.budget_limit && (
                              <p className="text-sm text-gray-600">Limite: {formatCurrency(costCenter.budget_limit)}</p>
                            )}
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                costCenter.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {costCenter.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewCostCenter(costCenter)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingItem(costCenter)
                                setShowCentroCustoModal(true)
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCostCenter(costCenter.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Categorias Tab */}
            {activeTab === 'categorias' && (
              <div className="space-y-4">
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria cadastrada</h3>
                    <p className="mt-1 text-sm text-gray-600">Comece criando sua primeira categoria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <h3 className="font-medium text-gray-900">{category.name}</h3>
                            </div>
                            {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
                            <div className="mt-2 flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                category.type === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {category.type === 'receita' ? 'Receita' : 'Despesa'}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {category.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewCategory(category)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingItem(category)
                                setShowCategoriaModal(true)
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contas Tab */}
            {activeTab === 'contas' && (
              <div className="space-y-4">
                {accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conta cadastrada</h3>
                    <p className="mt-1 text-sm text-gray-600">Comece criando sua primeira conta</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((account) => (
                      <div key={account.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{account.name}</h3>
                            <p className="text-sm text-gray-600">Tipo: {account.type}</p>
                            {account.bank && <p className="text-sm text-gray-600">Banco: {account.bank}</p>}
                            <p className={`text-sm font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Saldo: {formatCurrency(account.balance)}
                            </p>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {account.is_active ? 'Ativa' : 'Inativa'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewAccount(account)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingItem(account)
                                setShowContaModal(true)
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showFornecedorModal && (
          <NovoFornecedorModal
            isOpen={showFornecedorModal}
            onClose={() => {
              setShowFornecedorModal(false)
              setEditingItem(null)
            }}
            onSuccess={() => {
              setShowFornecedorModal(false)
              setEditingItem(null)
              loadSuppliers()
            }}
            editData={editingItem}
          />
        )}

        {showCentroCustoModal && (
          <NovoCentroCustoModal
            isOpen={showCentroCustoModal}
            onClose={() => {
              setShowCentroCustoModal(false)
              setEditingItem(null)
            }}
            onSuccess={() => {
              setShowCentroCustoModal(false)
              setEditingItem(null)
              loadCostCenters()
            }}
            editData={editingItem}
          />
        )}

        {showCategoriaModal && (
          <NovaCategoriaModal
            isOpen={showCategoriaModal}
            onClose={() => {
              setShowCategoriaModal(false)
              setEditingItem(null)
            }}
            onSuccess={() => {
              setShowCategoriaModal(false)
              setEditingItem(null)
              loadCategories()
            }}
            editData={editingItem}
          />
        )}

        {showContaModal && (
          <NovaContaRecebimentoModal
            isOpen={showContaModal}
            onClose={() => {
              setShowContaModal(false)
              setEditingItem(null)
            }}
            onSuccess={() => {
              setShowContaModal(false)
              setEditingItem(null)
              loadAccounts()
            }}
            editData={editingItem}
          />
        )}

        {/* Details Modal */}
        {showDetailsModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">
                  Detalhes {activeTab === 'fornecedores' ? 'do Fornecedor' : 
                           activeTab === 'centro-custo' ? 'do Centro de Custo' :
                           activeTab === 'categorias' ? 'da Categoria' : 'da Conta'}
                </h2>
                <button 
                  onClick={() => {
                    setShowDetailsModal(false)
                    setEditingItem(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(editingItem, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}