// src/app/financeiro/gestao/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Building, 
  Tag, 
  CreditCard, 
  Target,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Settings,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  AlertCircle
} from 'lucide-react'

interface GestaoStats {
  fornecedores: { total: number; ativos: number }
  centros_custo: { total: number; ativos: number }
  categorias: { total: number; receitas: number; despesas: number }
  contas: { total: number; ativas: number; saldo_total: number }
}

interface TabType {
  id: 'fornecedores' | 'centros' | 'categorias' | 'contas'
  label: string
  icon: any
  count?: number
}

export default function GestaoFinanceiraPage() {
  const [activeTab, setActiveTab] = useState<TabType['id']>('fornecedores')
  const [stats, setStats] = useState<GestaoStats>({
    fornecedores: { total: 0, ativos: 0 },
    centros_custo: { total: 0, ativos: 0 },
    categorias: { total: 0, receitas: 0, despesas: 0 },
    contas: { total: 0, ativas: 0, saldo_total: 0 }
  })
  const [loading, setLoading] = useState(true)

  const tabs: TabType[] = [
    { id: 'fornecedores', label: 'Fornecedores', icon: Building, count: stats.fornecedores.total },
    { id: 'centros', label: 'Centros de Custo', icon: Target, count: stats.centros_custo.total },
    { id: 'categorias', label: 'Categorias', icon: Tag, count: stats.categorias.total },
    { id: 'contas', label: 'Contas', icon: CreditCard, count: stats.contas.total }
  ]

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Carregar estatísticas de cada tabela
      const [fornecedoresRes, centrosRes, categoriasRes, contasRes] = await Promise.all([
        supabase.from('suppliers').select('id, is_active'),
        supabase.from('cost_centers').select('id, is_active'),
        supabase.from('custom_categories').select('id, type'),
        supabase.from('accounts').select('id, is_active, balance')
      ])

      const fornecedores = fornecedoresRes.data || []
      const centros = centrosRes.data || []
      const categorias = categoriasRes.data || []
      const contas = contasRes.data || []

      setStats({
        fornecedores: {
          total: fornecedores.length,
          ativos: fornecedores.filter(f => f.is_active).length
        },
        centros_custo: {
          total: centros.length,
          ativos: centros.filter(c => c.is_active).length
        },
        categorias: {
          total: categorias.length,
          receitas: categorias.filter(c => c.type === 'receita').length,
          despesas: categorias.filter(c => c.type === 'despesa').length
        },
        contas: {
          total: contas.length,
          ativas: contas.filter(c => c.is_active).length,
          saldo_total: contas.reduce((sum, c) => sum + (c.balance || 0), 0)
        }
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fornecedores':
        return <FornecedoresManager onUpdate={loadStats} />
      case 'centros':
        return <CentrosCustoManager onUpdate={loadStats} />
      case 'categorias':
        return <CategoriasManager onUpdate={loadStats} />
      case 'contas':
        return <ContasManager onUpdate={loadStats} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/financeiro" className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão Financeira</h1>
            <p className="text-gray-700">Gerencie fornecedores, centros de custo, categorias e contas</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 border border-gray-400">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <BarChart3 className="w-4 h-4" />
            <span>Relatórios</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Fornecedores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.fornecedores.total}</p>
              <p className="text-xs text-green-700">{stats.fornecedores.ativos} ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Centros de Custo</p>
              <p className="text-2xl font-bold text-gray-900">{stats.centros_custo.total}</p>
              <p className="text-xs text-green-700">{stats.centros_custo.ativos} ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Categorias</p>
              <p className="text-2xl font-bold text-gray-900">{stats.categorias.total}</p>
              <p className="text-xs text-blue-700">
                {stats.categorias.receitas} receitas, {stats.categorias.despesas} despesas
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Contas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.contas.total}</p>
              <p className="text-xs text-green-700">
                Saldo: {formatCurrency(stats.contas.saldo_total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-md border border-gray-300">
        <div className="border-b border-gray-300">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  )
}

// ✅ COMPONENTE FORNECEDORES IMPLEMENTADO
function FornecedoresManager({ onUpdate }: { onUpdate: () => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.trading_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStatus = async (supplier: any) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: !supplier.is_active })
        .eq('id', supplier.id)

      if (error) throw error
      await loadSuppliers()
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const formatDocument = (supplier: any) => {
    if (supplier.person_type === 'juridica' && supplier.cnpj) {
      return supplier.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    if (supplier.person_type === 'fisica' && supplier.cpf) {
      return supplier.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return 'Não informado'
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
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar fornecedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="text-sm text-gray-700">
          {filteredSuppliers.length} de {suppliers.length} fornecedores
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg border border-gray-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Localização
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
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.company_name}
                        </div>
                        {supplier.trading_name && (
                          <div className="text-sm text-gray-600">
                            {supplier.trading_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {supplier.person_type === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDocument(supplier)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {supplier.contact_person && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-500" />
                          {supplier.contact_person}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-1" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-1" />
                          {supplier.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {supplier.city && supplier.state ? (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {supplier.city}, {supplier.state}
                      </div>
                    ) : (
                      'Não informado'
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(supplier)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {supplier.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-900 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum fornecedor encontrado</h3>
            <p className="mt-1 text-sm text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro fornecedor.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ✅ COMPONENTE CENTROS DE CUSTO IMPLEMENTADO
function CentrosCustoManager({ onUpdate }: { onUpdate: () => void }) {
  const [costCenters, setCostCenters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCostCenters()
  }, [])

  const loadCostCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('name')

      if (error) throw error
      setCostCenters(data || [])
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCostCenters = costCenters.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStatus = async (center: any) => {
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
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      administrativo: 'Administrativo',
      comercial: 'Comercial',
      operacional: 'Operacional',
      tecnologia: 'Tecnologia',
      marketing: 'Marketing'
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
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar centros de custo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="text-sm text-gray-700">
          {filteredCostCenters.length} de {costCenters.length} centros de custo
        </div>
      </div>

      {/* Cost Centers Table */}
      <div className="bg-white rounded-lg border border-gray-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Centro de Custo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Orçamento
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
              {filteredCostCenters.map((center) => (
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
                          <div className="text-sm text-gray-600">
                            Código: {center.code}
                          </div>
                        )}
                        {center.description && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">
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
                        <User className="w-4 h-4 mr-1 text-gray-500" />
                        {center.responsible_person}
                      </div>
                    ) : (
                      <span className="text-gray-500">Não definido</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {center.budget_limit ? (
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                        {formatCurrency(center.budget_limit)}
                      </div>
                    ) : (
                      <span className="text-gray-500">Sem limite</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(center)}
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
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-900 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCostCenters.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum centro de custo encontrado</h3>
            <p className="mt-1 text-sm text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro centro de custo.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Placeholder components para outras abas
function CategoriasManager({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="text-center py-12">
      <Tag className="mx-auto h-12 w-12 text-gray-500" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Gerenciador de Categorias</h3>
      <p className="mt-1 text-sm text-gray-600">Em desenvolvimento</p>
    </div>
  )
}

function ContasManager({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="text-center py-12">
      <CreditCard className="mx-auto h-12 w-12 text-gray-500" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Gerenciador de Contas</h3>
      <p className="mt-1 text-sm text-gray-600">Em desenvolvimento</p>
    </div>
  )
}