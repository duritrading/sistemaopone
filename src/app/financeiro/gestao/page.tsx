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
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  is_active: boolean
}

interface CostCenter {
  id: string
  name: string
  description?: string
  is_active: boolean
}

interface Category {
  id: string
  name: string
  type: 'receita' | 'despesa'
  color: string
  is_active: boolean
}

interface Account {
  id: string
  name: string
  type: string
  bank?: string
  balance: number
  is_active: boolean
}

type ActiveTab = 'fornecedores' | 'centro-custo' | 'categorias' | 'contas'

export default function GestaoFinanceiraPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('fornecedores')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

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
      const { data } = await supabase.from('suppliers').select('*').order('name')
      setSuppliers(data || [])
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err)
    }
  }

  const loadCostCenters = async () => {
    try {
      const { data } = await supabase.from('cost_centers').select('*').order('name')
      setCostCenters(data || [])
    } catch (err) {
      console.error('Erro ao carregar centros de custo:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const { data } = await supabase.from('custom_categories').select('*').order('name')
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  const loadAccounts = async () => {
    try {
      const { data } = await supabase.from('accounts').select('*').order('name')
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
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                      <div key={supplier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                            {supplier.email && <p className="text-sm text-gray-600">{supplier.email}</p>}
                            {supplier.phone && <p className="text-sm text-gray-600">{supplier.phone}</p>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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
                      <div key={costCenter.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{costCenter.name}</h3>
                            {costCenter.description && <p className="text-sm text-gray-600">{costCenter.description}</p>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div>
                              <h3 className="font-medium text-gray-900">{category.name}</h3>
                              <p className="text-sm text-gray-600 capitalize">{category.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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
                      <div key={account.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{account.name}</h3>
                            <p className="text-sm text-gray-600">{account.type}</p>
                            {account.bank && <p className="text-sm text-gray-600">{account.bank}</p>}
                            <p className="text-sm font-medium text-green-600 mt-1">
                              {formatCurrency(account.balance)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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
      </div>
    </div>
  )
}