// src/app/clientes/page.tsx - Layout corrigido
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Plus, Search, Filter, Eye, Edit2, Trash2, Users, 
  TrendingUp, DollarSign, Building2, Heart, AlertTriangle,
  CheckCircle, XCircle, Clock, Phone, Mail, MapPin
} from 'lucide-react'
import { Client, ClientMetrics, RelationshipStatus, AccountHealth } from '@/types/clients'
import NewClientModal from '@/components/modals/NewClientModal'
import ClientDetailsModal from '@/components/modals/ClientDetailsModal'
import EditClientModal from '@/components/modals/EditClientModal'
import DeleteClientModal from '@/components/modals/DeleteClientModal'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RelationshipStatus | 'all'>('all')
  const [healthFilter, setHealthFilter] = useState<AccountHealth | 'all'>('all')
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadClients()
    loadMetrics()
  }, [])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          account_manager:team_members(id, full_name, email),
          contacts:client_contacts(id, full_name, email, phone, is_primary)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('relationship_status, account_health, total_contract_value, monthly_recurring_revenue')
        .eq('is_active', true)

      if (error) throw error

      const statusCounts = data.reduce((acc, client) => {
        acc[client.relationship_status] = (acc[client.relationship_status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const healthCounts = data.reduce((acc, client) => {
        acc[client.account_health] = (acc[client.account_health] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const totalClients = data.length
      const totalContractValue = data.reduce((sum, client) => sum + (client.total_contract_value || 0), 0)
      const totalMRR = data.reduce((sum, client) => sum + (client.monthly_recurring_revenue || 0), 0)

      const metricsData: ClientMetrics = {
        total_clients: totalClients,
        active_clients: statusCounts['Ativo'] || 0,
        prospects: statusCounts['Prospect'] || 0,
        churned_clients: statusCounts['Churned'] || 0,
        total_contract_value: totalContractValue,
        monthly_recurring_revenue: totalMRR,
        average_contract_value: totalClients > 0 ? totalContractValue / totalClients : 0,
        clients_by_health: {
          excellent: healthCounts['Excelente'] || 0,
          healthy: healthCounts['Saudável'] || 0,
          at_risk: healthCounts['Em Risco'] || 0,
          critical: healthCounts['Crítico'] || 0
        },
        clients_by_size: {
          startup: 0,
          small: 0,
          medium: 0,
          large: 0,
          enterprise: 0
        }
      }

      setMetrics(metricsData)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtros
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.relationship_status === statusFilter
    const matchesHealth = healthFilter === 'all' || client.account_health === healthFilter
    return matchesSearch && matchesStatus && matchesHealth
  })

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getStatusIcon = (status: RelationshipStatus) => {
    switch (status) {
      case 'Ativo': return <CheckCircle className="w-3 h-3 text-white" />
      case 'Prospect': return <Clock className="w-3 h-3 text-blue-600" />
      case 'Renovação': return <TrendingUp className="w-3 h-3 text-orange-600" />
      case 'Inativo': return <XCircle className="w-3 h-3 text-gray-600" />
      case 'Churned': return <AlertTriangle className="w-3 h-3 text-red-600" />
      default: return null
    }
  }

  const getHealthColor = (health: AccountHealth) => {
    switch (health) {
      case 'Excelente': return 'bg-green-100 text-green-800'
      case 'Saudável': return 'bg-blue-100 text-blue-800'
      case 'Em Risco': return 'bg-yellow-100 text-yellow-800'
      case 'Crítico': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: RelationshipStatus) => {
    switch (status) {
      case 'Ativo': return 'bg-green-600 text-white'
      case 'Prospect': return 'bg-gray-100 text-gray-800'
      case 'Renovação': return 'bg-orange-100 text-orange-800'
      case 'Inativo': return 'bg-gray-100 text-gray-800'
      case 'Churned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrimaryContact = (contacts?: any[]) => {
    return contacts?.find(contact => contact.is_primary) || contacts?.[0]
  }

  // Event handlers
  const handleClientCreated = () => {
    loadClients()
    loadMetrics()
  }

  const handleClientUpdated = () => {
    loadClients()
    loadMetrics()
  }

  const handleClientDeleted = () => {
    loadClients()
    loadMetrics()
  }

  const handleViewClient = (clientId: string) => {
    setSelectedClientId(clientId)
    setShowDetailsModal(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setShowEditModal(true)
    setShowDetailsModal(false)
  }

  const handleEditClientDirect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setSelectedClient(client)
      setShowEditModal(true)
    }
  }

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setClientToDelete(client)
      setShowDeleteModal(true)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestão completa de relacionamento com clientes</p>
        </div>
        <button 
          onClick={() => setShowNewClientModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.total_clients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4 flex gap-4 text-xs">
              <span className="text-green-600">
                ✅ {metrics.active_clients} Ativos
              </span>
              <span className="text-blue-600">
                🔄 {metrics.prospects} Prospects
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Valor Total Contratos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.total_contract_value)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Média: {formatCurrency(metrics.average_contract_value)}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">MRR Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.monthly_recurring_revenue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Receita recorrente mensal
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Saúde das Contas</p>
                <div className="flex gap-1 mt-2">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{metrics.clients_by_health.excellent + metrics.clients_by_health.healthy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{metrics.clients_by_health.at_risk + metrics.clients_by_health.critical}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="text-green-600">✅ {metrics.clients_by_health.healthy} Saudáveis</div>
              <div className="text-yellow-600">⚠️ {metrics.clients_by_health.at_risk} Em Risco</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome da empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RelationshipStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="Prospect">Prospect</option>
                <option value="Ativo">Ativo</option>
                <option value="Renovação">Renovação</option>
                <option value="Inativo">Inativo</option>
                <option value="Churned">Churned</option>
              </select>

              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value as AccountHealth | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as Saúdes</option>
                <option value="Excelente">Excelente</option>
                <option value="Saudável">Saudável</option>
                <option value="Em Risco">Em Risco</option>
                <option value="Crítico">Crítico</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Clientes - LAYOUT CORRIGIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const primaryContact = getPrimaryContact(client.contacts)
          
          return (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Header do Card - CORRIGIDO */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-gray-700 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight break-words">
                        {client.company_name}
                      </h3>
                    </div>
                    {client.industry && (
                      <p className="text-xs text-gray-600 truncate">{client.industry}</p>
                    )}
                  </div>
                  {/* Botões de Ação - POSICIONAMENTO CORRIGIDO */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button 
                      onClick={() => handleViewClient(client.id)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditClientDirect(client.id)}
                      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status e Saúde */}
                <div className="flex gap-2 mb-4">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(client.relationship_status)}`}>
                    {getStatusIcon(client.relationship_status)}
                    <span className="text-xs font-medium">{client.relationship_status}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(client.account_health)}`}>
                    {client.account_health}
                  </div>
                </div>

                {/* Contato Principal */}
                {primaryContact && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm text-gray-900 mb-1">{primaryContact.full_name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-700">
                      {primaryContact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{primaryContact.email}</span>
                        </div>
                      )}
                      {primaryContact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{primaryContact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informações Comerciais - VALORES CORRIGIDOS */}
                <div className="space-y-2">
                  {client.total_contract_value > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor Contrato:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(client.total_contract_value)}</span>
                    </div>
                  )}
                  {client.monthly_recurring_revenue > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">MRR:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(client.monthly_recurring_revenue)}</span>
                    </div>
                  )}
                  {client.account_manager && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Responsável:</span>
                      <span className="font-medium text-gray-900 truncate ml-2" title={client.account_manager.full_name}>
                        {client.account_manager.full_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Localização */}
                {(client.address_city || client.address_state) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {client.address_city}{client.address_city && client.address_state && ', '}{client.address_state}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Estado Vazio */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || healthFilter !== 'all'
              ? 'Tente ajustar os filtros para encontrar clientes.'
              : 'Comece adicionando seu primeiro cliente.'
            }
          </p>
          <button 
            onClick={() => setShowNewClientModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>
      )}

      {/* Modais */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onClientCreated={handleClientCreated}
      />

      <ClientDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        clientId={selectedClientId}
        onEditClient={handleEditClient}
      />

      <EditClientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />

      <DeleteClientModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        client={clientToDelete}
        onClientDeleted={handleClientDeleted}
      />
    </div>
  )
}