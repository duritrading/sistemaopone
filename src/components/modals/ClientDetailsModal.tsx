// src/components/modals/ClientDetailsModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  X, Building2, MapPin, DollarSign, User, FileText, Phone, Mail, 
  Users, MessageSquare, Calendar, Plus, Edit2, CheckCircle, Clock,
  XCircle, TrendingUp, AlertTriangle, Heart, Globe, MapPinIcon, Trash2,
  Search, Filter
} from 'lucide-react'
import { Client, ClientContact, ClientInteraction, InteractionType, InteractionOutcome } from '@/types/clients'
import NewContactModal from '@/components/modals/NewContactModal'
import EditContactModal from '@/components/modals/EditContactModal'

interface ClientDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string | null
  onEditClient: (client: Client) => void
}

interface TeamMember {
  id: string
  full_name: string
  email: string
}

export default function ClientDetailsModal({ 
  isOpen, 
  onClose, 
  clientId, 
  onEditClient 
}: ClientDetailsModalProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [contacts, setContacts] = useState<ClientContact[]>([])
  const [interactions, setInteractions] = useState<ClientInteraction[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'contacts' | 'interactions'>('details')
  
  // Estados para nova interação
  const [showNewInteraction, setShowNewInteraction] = useState(false)
  const [newInteraction, setNewInteraction] = useState({
    interaction_type: 'Ligação' as InteractionType,
    title: '',
    description: '',
    outcome: 'Positivo' as InteractionOutcome,
    contact_id: ''
  })
  const [savingInteraction, setSavingInteraction] = useState(false)

  // Estados para contatos
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [showEditContactModal, setShowEditContactModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(null)

  // Estados para filtros de interações
  const [interactionFilters, setInteractionFilters] = useState({
    search: '',
    type: 'all' as InteractionType | 'all',
    outcome: 'all' as InteractionOutcome | 'all',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month' | 'quarter'
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (isOpen && clientId) {
      loadClientDetails()
    }
  }, [isOpen, clientId])

  const loadClientDetails = async () => {
    if (!clientId) return
    
    setLoading(true)
    try {
      // Carregar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          account_manager:team_members(id, full_name, email)
        `)
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Carregar contatos
      const { data: contactsData, error: contactsError } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (contactsError) throw contactsError
      setContacts(contactsData || [])

      // Carregar interações
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('client_interactions')
        .select(`
          *,
          contact:client_contacts(id, full_name, email),
          creator:team_members(id, full_name, email)
        `)
        .eq('client_id', clientId)
        .order('interaction_date', { ascending: false })

      if (interactionsError) throw interactionsError
      setInteractions(interactionsData || [])

      // Carregar membros da equipe
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name')

      if (teamError) throw teamError
      setTeamMembers(teamData || [])

    } catch (error) {
      console.error('Erro ao carregar detalhes do cliente:', error)
      alert('Erro ao carregar dados do cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInteraction = async () => {
    if (!clientId || !newInteraction.title.trim()) return

    setSavingInteraction(true)
    try {
      const interactionData = {
        client_id: clientId,
        contact_id: newInteraction.contact_id || null,
        interaction_type: newInteraction.interaction_type,
        title: newInteraction.title,
        description: newInteraction.description || null,
        outcome: newInteraction.outcome,
        created_by: teamMembers[0]?.id || null, // Usar primeiro membro como padrão
        interaction_date: new Date().toISOString()
      }

      const { error } = await supabase
        .from('client_interactions')
        .insert([interactionData])

      if (error) throw error

      // Resetar formulário
      setNewInteraction({
        interaction_type: 'Ligação',
        title: '',
        description: '',
        outcome: 'Positivo',
        contact_id: ''
      })
      setShowNewInteraction(false)
      
      // Recarregar interações
      loadClientDetails()
      alert('Interação adicionada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar interação:', error)
      alert('Erro ao adicionar interação')
    } finally {
      setSavingInteraction(false)
    }
  }

  const handleContactCreated = () => {
    loadClientDetails()
  }

  const handleContactUpdated = () => {
    loadClientDetails()
  }

  const handleEditContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact) {
      setSelectedContact(contact)
      setShowEditContactModal(true)
    }
  }

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o contato "${contactName}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('client_contacts')
        .update({ is_active: false })
        .eq('id', contactId)

      if (error) throw error

      // Criar interação de exclusão
      if (clientId) {
        await supabase
          .from('client_interactions')
          .insert([{
            client_id: clientId,
            contact_id: contactId,
            interaction_type: 'Nota',
            title: 'Contato removido',
            description: `Contato ${contactName} foi removido`,
            outcome: 'Neutro',
            interaction_date: new Date().toISOString()
          }])
      }

      loadClientDetails()
      alert('Contato removido com sucesso!')
    } catch (error) {
      console.error('Erro ao remover contato:', error)
      alert('Erro ao remover contato')
    }
  }

  // Filtrar interações
  const filteredInteractions = interactions.filter(interaction => {
    // Filtro por busca
    const matchesSearch = !interactionFilters.search || 
      interaction.title.toLowerCase().includes(interactionFilters.search.toLowerCase()) ||
      interaction.description?.toLowerCase().includes(interactionFilters.search.toLowerCase())

    // Filtro por tipo
    const matchesType = interactionFilters.type === 'all' || interaction.interaction_type === interactionFilters.type

    // Filtro por outcome
    const matchesOutcome = interactionFilters.outcome === 'all' || interaction.outcome === interactionFilters.outcome

    // Filtro por data
    let matchesDate = true
    if (interactionFilters.dateRange !== 'all') {
      const interactionDate = new Date(interaction.interaction_date)
      const now = new Date()
      
      switch (interactionFilters.dateRange) {
        case 'today':
          matchesDate = interactionDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = interactionDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = interactionDate >= monthAgo
          break
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          matchesDate = interactionDate >= quarterAgo
          break
      }
    }

    return matchesSearch && matchesType && matchesOutcome && matchesDate
  })

  const resetInteractionFilters = () => {
    setInteractionFilters({
      search: '',
      type: 'all',
      outcome: 'all',
      dateRange: 'all'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'Prospect': return <Clock className="w-5 h-5 text-blue-500" />
      case 'Renovação': return <TrendingUp className="w-5 h-5 text-orange-500" />
      case 'Inativo': return <XCircle className="w-5 h-5 text-gray-500" />
      case 'Churned': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excelente': return 'text-green-600 bg-green-100'
      case 'Saudável': return 'text-blue-600 bg-blue-100'
      case 'Em Risco': return 'text-orange-600 bg-orange-100'
      case 'Crítico': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'Ligação': return <Phone className="w-4 h-4 text-green-500" />
      case 'Email': return <Mail className="w-4 h-4 text-blue-500" />
      case 'Reunião': return <Users className="w-4 h-4 text-purple-500" />
      case 'Apresentação': return <FileText className="w-4 h-4 text-orange-500" />
      case 'Check-in': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'Suporte': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  const getOutcomeColor = (outcome: InteractionOutcome | null) => {
    switch (outcome) {
      case 'Positivo': return 'text-green-600 bg-green-100'
      case 'Negativo': return 'text-red-600 bg-red-100'
      case 'Neutro': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{client.company_name}</h2>
              <p className="text-sm text-gray-600">{client.industry || 'Setor não informado'}</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                {getStatusIcon(client.relationship_status)}
                <span className="text-xs font-medium">{client.relationship_status}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(client.account_health)}`}>
                {client.account_health}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditClient(client)}
              className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Detalhes', icon: Building2 },
              { id: 'contacts', label: 'Contatos', icon: Users },
              { id: 'interactions', label: 'Interações', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'contacts' && contacts.length > 0 && (
                  <span className="ml-1 bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                    {contacts.length}
                  </span>
                )}
                {tab.id === 'interactions' && interactions.length > 0 && (
                  <span className="ml-1 bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                    {interactions.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Tab: Detalhes */}
              {activeTab === 'details' && (
                <div className="p-6 space-y-8">
                  {/* Dados da Empresa */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-600">Nome da Empresa</label>
                          <p className="font-medium">{client.company_name}</p>
                        </div>
                        {client.company_cnpj && (
                          <div>
                            <label className="text-sm text-gray-600">CNPJ</label>
                            <p className="font-medium">{client.company_cnpj}</p>
                          </div>
                        )}
                        {client.company_size && (
                          <div>
                            <label className="text-sm text-gray-600">Porte</label>
                            <p className="font-medium">{client.company_size}</p>
                          </div>
                        )}
                        {client.industry && (
                          <div>
                            <label className="text-sm text-gray-600">Setor</label>
                            <p className="font-medium">{client.industry}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {client.website && (
                          <div>
                            <label className="text-sm text-gray-600">Website</label>
                            <p className="font-medium">
                              <a 
                                href={client.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Globe className="w-4 h-4" />
                                {client.website}
                              </a>
                            </p>
                          </div>
                        )}
                        {client.account_manager && (
                          <div>
                            <label className="text-sm text-gray-600">Responsável pela Conta</label>
                            <p className="font-medium">{client.account_manager.full_name}</p>
                            <p className="text-sm text-gray-500">{client.account_manager.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  {(client.address_street || client.address_city) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Endereço
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {client.address_street && <p>{client.address_street}</p>}
                        <p>
                          {client.address_city}{client.address_city && client.address_state && ', '}
                          {client.address_state} {client.address_zipcode}
                        </p>
                        {client.address_country && <p>{client.address_country}</p>}
                      </div>
                    </div>
                  )}

                  {/* Informações Comerciais */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Informações Comerciais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600">Valor Total do Contrato</p>
                        <p className="text-xl font-bold text-green-800">
                          {formatCurrency(client.total_contract_value)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600">MRR</p>
                        <p className="text-xl font-bold text-blue-800">
                          {formatCurrency(client.monthly_recurring_revenue)}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600">Duração do Contrato</p>
                        <p className="text-sm font-medium text-purple-800">
                          {client.contract_start_date && client.contract_end_date ? (
                            <>
                              {new Date(client.contract_start_date).toLocaleDateString('pt-BR')} até{' '}
                              {new Date(client.contract_end_date).toLocaleDateString('pt-BR')}
                            </>
                          ) : (
                            'Não definido'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {client.notes && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Observações
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Datas */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Sistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Criado em:</span> {formatDate(client.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Atualizado em:</span> {formatDate(client.updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Contatos */}
              {activeTab === 'contacts' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Contatos</h3>
                    <button 
                      onClick={() => setShowNewContactModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Contato
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nenhum contato cadastrado</p>
                      <button 
                        onClick={() => setShowNewContactModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Primeiro Contato
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contacts.map(contact => (
                        <div key={contact.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{contact.full_name}</h4>
                              {contact.job_title && (
                                <p className="text-sm text-gray-600">{contact.job_title}</p>
                              )}
                              {contact.department && (
                                <p className="text-xs text-gray-500">{contact.department}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {contact.is_primary && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Principal
                                </span>
                              )}
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                {contact.contact_type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.mobile && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <a href={`tel:${contact.mobile}`} className="text-blue-600 hover:underline">
                                  {contact.mobile} (móvel)
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Ações do Contato */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => handleEditContact(contact.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar contato"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id, contact.full_name)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remover contato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Interações */}
              {activeTab === 'interactions' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Histórico de Interações 
                      {filteredInteractions.length !== interactions.length && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({filteredInteractions.length} de {interactions.length})
                        </span>
                      )}
                    </h3>
                    <button 
                      onClick={() => setShowNewInteraction(!showNewInteraction)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Interação
                    </button>
                  </div>

                  {/* Filtros */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium text-gray-900">Filtros</h4>
                      {(interactionFilters.search || interactionFilters.type !== 'all' || 
                        interactionFilters.outcome !== 'all' || interactionFilters.dateRange !== 'all') && (
                        <button
                          onClick={resetInteractionFilters}
                          className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Busca */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Título ou descrição..."
                            value={interactionFilters.search}
                            onChange={(e) => setInteractionFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          value={interactionFilters.type}
                          onChange={(e) => setInteractionFilters(prev => ({ 
                            ...prev, 
                            type: e.target.value as InteractionType | 'all' 
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Todos os tipos</option>
                          <option value="Ligação">Ligação</option>
                          <option value="Email">Email</option>
                          <option value="Reunião">Reunião</option>
                          <option value="Apresentação">Apresentação</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Check-in">Check-in</option>
                          <option value="Suporte">Suporte</option>
                          <option value="Renovação">Renovação</option>
                          <option value="Feedback">Feedback</option>
                          <option value="Nota">Nota</option>
                        </select>
                      </div>

                      {/* Resultado */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Resultado</label>
                        <select
                          value={interactionFilters.outcome}
                          onChange={(e) => setInteractionFilters(prev => ({ 
                            ...prev, 
                            outcome: e.target.value as InteractionOutcome | 'all' 
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Todos os resultados</option>
                          <option value="Positivo">Positivo</option>
                          <option value="Neutro">Neutro</option>
                          <option value="Negativo">Negativo</option>
                        </select>
                      </div>

                      {/* Período */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
                        <select
                          value={interactionFilters.dateRange}
                          onChange={(e) => setInteractionFilters(prev => ({ 
                            ...prev, 
                            dateRange: e.target.value as any 
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">Todo período</option>
                          <option value="today">Hoje</option>
                          <option value="week">Última semana</option>
                          <option value="month">Último mês</option>
                          <option value="quarter">Último trimestre</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Formulário Nova Interação */}
                  {showNewInteraction && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Adicionar Nova Interação</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                          <select
                            value={newInteraction.interaction_type}
                            onChange={(e) => setNewInteraction(prev => ({ 
                              ...prev, 
                              interaction_type: e.target.value as InteractionType 
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Ligação">📞 Ligação</option>
                            <option value="Email">✉️ Email</option>
                            <option value="Reunião">🎥 Reunião</option>
                            <option value="Apresentação">📊 Apresentação</option>
                            <option value="Workshop">🎓 Workshop</option>
                            <option value="Check-in">✅ Check-in</option>
                            <option value="Suporte">🛠️ Suporte</option>
                            <option value="Renovação">🔄 Renovação</option>
                            <option value="Feedback">💬 Feedback</option>
                            <option value="Nota">📝 Nota</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
                          <select
                            value={newInteraction.outcome}
                            onChange={(e) => setNewInteraction(prev => ({ 
                              ...prev, 
                              outcome: e.target.value as InteractionOutcome 
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Positivo">😊 Positivo</option>
                            <option value="Neutro">😐 Neutro</option>
                            <option value="Negativo">😞 Negativo</option>
                          </select>
                        </div>
                      </div>
                      
                      {contacts.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contato (opcional)</label>
                          <select
                            value={newInteraction.contact_id}
                            onChange={(e) => setNewInteraction(prev => ({ ...prev, contact_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecionar contato...</option>
                            {contacts.map(contact => (
                              <option key={contact.id} value={contact.id}>
                                {contact.full_name} - {contact.job_title || contact.contact_type}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                        <input
                          type="text"
                          value={newInteraction.title}
                          onChange={(e) => setNewInteraction(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Reunião de acompanhamento mensal"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                          value={newInteraction.description}
                          onChange={(e) => setNewInteraction(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Detalhes da interação..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateInteraction}
                          disabled={!newInteraction.title.trim() || savingInteraction}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingInteraction ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Adicionar
                        </button>
                        <button
                          onClick={() => setShowNewInteraction(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de Interações */}
                  {interactions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nenhuma interação registrada</p>
                      <button 
                        onClick={() => setShowNewInteraction(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Primeira Interação
                      </button>
                    </div>
                  ) : filteredInteractions.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Nenhuma interação encontrada</p>
                      <p className="text-gray-500 text-sm mb-4">Tente ajustar os filtros para encontrar interações.</p>
                      <button 
                        onClick={resetInteractionFilters}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Limpar todos os filtros
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredInteractions.map(interaction => (
                        <div key={interaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              {getInteractionIcon(interaction.interaction_type)}
                              <div>
                                <h4 className="font-medium text-gray-900">{interaction.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>{interaction.interaction_type}</span>
                                  {interaction.contact && (
                                    <>
                                      <span>•</span>
                                      <span>{interaction.contact.full_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {interaction.outcome && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(interaction.outcome)}`}>
                                  {interaction.outcome}
                                </span>
                              )}
                              <span>{formatDate(interaction.interaction_date)}</span>
                            </div>
                          </div>
                          
                          {interaction.description && (
                            <p className="text-gray-700 mb-3 pl-7">{interaction.description}</p>
                          )}
                          
                          <div className="flex justify-between items-center text-xs text-gray-500 pl-7">
                            <div>
                              {interaction.creator && (
                                <span>Criado por: {interaction.creator.full_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Novo Contato */}
      <NewContactModal
        isOpen={showNewContactModal}
        onClose={() => setShowNewContactModal(false)}
        clientId={clientId}
        clientName={client?.company_name || ''}
        onContactCreated={handleContactCreated}
      />

      {/* Modal Editar Contato */}
      <EditContactModal
        isOpen={showEditContactModal}
        onClose={() => setShowEditContactModal(false)}
        contact={selectedContact}
        clientName={client?.company_name || ''}
        onContactUpdated={handleContactUpdated}
      />
    </div>
  )
}