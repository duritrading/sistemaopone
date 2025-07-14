// src/components/modals/ClientDetailsModal.tsx - Contraste corrigido
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Prospect': return <Clock className="w-4 h-4 text-blue-600" />
      case 'Renovação': return <TrendingUp className="w-4 h-4 text-orange-600" />
      case 'Inativo': return <XCircle className="w-4 h-4 text-gray-600" />
      case 'Churned': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excelente': return 'bg-green-100 text-green-800'
      case 'Saudável': return 'bg-blue-100 text-blue-800'
      case 'Em Risco': return 'bg-yellow-100 text-yellow-800'
      case 'Crítico': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-600 text-white'
      case 'Prospect': return 'bg-gray-100 text-gray-800'
      case 'Renovação': return 'bg-orange-100 text-orange-800'
      case 'Inativo': return 'bg-gray-100 text-gray-800'
      case 'Churned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Positivo': return 'bg-green-100 text-green-800'
      case 'Neutro': return 'bg-gray-100 text-gray-800'
      case 'Negativo': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
        created_by: teamMembers[0]?.id || null,
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

      loadClientDetails()
      alert('Contato removido com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
      alert('Erro ao remover contato')
    }
  }

  if (!isOpen || !clientId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{client?.company_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(client?.account_health || '')}`}>
                  {client?.account_health}
                </div>
                {client?.industry && (
                  <span className="text-sm text-gray-600">{client.industry}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => client && onEditClient(client)}
              className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-100 hover:bg-green-200 rounded-lg  transition-colors"
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
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Detalhes
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contatos
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {contacts.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'interactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Interações
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {interactions.length}
                </span>
              </div>
            </button>
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
              {/* Tab Detalhes */}
              {activeTab === 'details' && client && (
                <div className="p-6 space-y-8">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Informações da Empresa
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Nome da Empresa</label>
                          <p className="text-base font-semibold text-gray-900">{client.company_name}</p>
                        </div>
                        {client.company_cnpj && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">CNPJ</label>
                            <p className="text-base text-gray-900">{client.company_cnpj}</p>
                          </div>
                        )}
                        {client.company_size && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Porte</label>
                            <p className="text-base text-gray-900">{client.company_size}</p>
                          </div>
                        )}
                        {client.industry && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Setor</label>
                            <p className="text-base text-gray-900">{client.industry}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {client.website && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Website</label>
                            <p className="text-base">
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
                            <label className="text-sm font-medium text-gray-700">Responsável pela Conta</label>
                            <p className="text-base font-medium text-gray-900">{client.account_manager.full_name}</p>
                            <p className="text-sm text-gray-600">{client.account_manager.email}</p>
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
                        {client.address_street && <p className="text-gray-900">{client.address_street}</p>}
                        <p className="text-gray-900">
                          {client.address_city}{client.address_city && client.address_state && ', '}
                          {client.address_state} {client.address_zipcode}
                        </p>
                        {client.address_country && <p className="text-gray-900">{client.address_country}</p>}
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
                        <p className="text-sm font-medium text-green-700">Valor Total do Contrato</p>
                        <p className="text-xl font-bold text-green-900">
                          {formatCurrency(client.total_contract_value)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-700">MRR</p>
                        <p className="text-xl font-bold text-blue-900">
                          {formatCurrency(client.monthly_recurring_revenue)}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-purple-700">Duração do Contrato</p>
                        <p className="text-sm font-medium text-purple-900">
                          {client.contract_start_date && client.contract_end_date
                            ? `${formatDate(client.contract_start_date)} - ${formatDate(client.contract_end_date)}`
                            : 'Não definido'
                          }
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
                        <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Informações do Sistema */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Sistema</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Criado em:</label>
                        <p className="font-medium text-gray-900">{formatDate(client.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Atualizado em:</label>
                        <p className="font-medium text-gray-900">{formatDate(client.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Contatos */}
              {activeTab === 'contacts' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Contatos</h3>
                    <button
                      onClick={() => setShowNewContactModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-gray-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Contato
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum contato cadastrado</p>
                      <button
                        onClick={() => setShowNewContactModal(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700"
                      >
                        Adicionar primeiro contato
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contacts.map(contact => (
                        <div key={contact.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">{contact.full_name}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  contact.is_primary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {contact.contact_type}
                                </span>
                                {contact.is_primary && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Principal
                                  </span>
                                )}
                              </div>
                              {contact.job_title && (
                                <p className="text-sm text-gray-700 mb-2">{contact.job_title}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                {contact.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                      {contact.email}
                                    </a>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                      {contact.phone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditContact(contact.id)}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id, contact.full_name)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

              {/* Tab Interações */}
              {activeTab === 'interactions' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Histórico de Interações</h3>
                    <button
                      onClick={() => setShowNewInteraction(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-gray-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Interação
                    </button>
                  </div>

                  {/* Formulário de nova interação */}
                  {showNewInteraction && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Adicionar Nova Interação</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">Tipo</label>
                          <select
                            value={newInteraction.interaction_type}
                            onChange={(e) => setNewInteraction(prev => ({ ...prev, interaction_type: e.target.value as InteractionType }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          >
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
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">Resultado</label>
                          <select
                            value={newInteraction.outcome}
                            onChange={(e) => setNewInteraction(prev => ({ ...prev, outcome: e.target.value as InteractionOutcome }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          >
                            <option value="Positivo">Positivo</option>
                            <option value="Neutro">Neutro</option>
                            <option value="Negativo">Negativo</option>
                          </select>
                        </div>
                      </div>
                      
                      {contacts.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-800 mb-1">Contato (opcional)</label>
                          <select
                            value={newInteraction.contact_id}
                            onChange={(e) => setNewInteraction(prev => ({ ...prev, contact_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                        <label className="block text-sm font-medium text-gray-800 mb-1">Título</label>
                        <input
                          type="text"
                          value={newInteraction.title}
                          onChange={(e) => setNewInteraction(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="Ex: Reunião de acompanhamento mensal"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-800 mb-1">Descrição</label>
                        <textarea
                          value={newInteraction.description}
                          onChange={(e) => setNewInteraction(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Salvando...
                            </>
                          ) : (
                            'Adicionar'
                          )}
                        </button>
                        <button
                          onClick={() => setShowNewInteraction(false)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de interações */}
                  {interactions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhuma interação registrada</p>
                      <button
                        onClick={() => setShowNewInteraction(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700"
                      >
                        Adicionar primeira interação
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {interactions.map(interaction => (
                        <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div>
                                <h4 className="font-medium text-gray-900">{interaction.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
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
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {interaction.outcome && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(interaction.outcome)}`}>
                                  {interaction.outcome}
                                </span>
                              )}
                              <span>{formatDate(interaction.interaction_date)}</span>
                            </div>
                          </div>
                          
                          {interaction.description && (
                            <p className="text-gray-800 mb-3 pl-5">{interaction.description}</p>
                          )}
                          
                          <div className="flex justify-between items-center text-xs text-gray-600 pl-5">
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