import React, { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  ThumbsUp, 
  Plus, 
  Filter,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  FileText,
  TrendingUp
} from 'lucide-react'

// === INTERFACES ===
interface Communication {
  id: string
  project_id: string
  type: 'Reunião' | 'E-mail' | 'Decisão' | 'Escalação'
  title: string
  content: string
  participants: string[]
  follow_up_actions: string[]
  sentiment: 'negativo' | 'neutro' | 'positivo'
  communication_date: string
  created_at: string
  updated_at: string
}

interface TeamMember {
  id: string
  full_name: string
  email: string
  primary_specialization?: string
}

interface CommunicationTabProps {
  projectId: string
  teamMembers?: TeamMember[]
  loading?: boolean
}

// === MOCK DATA ===
const mockCommunications: Communication[] = []

// === COMPONENTES ===
const CommunicationCard = ({ 
  communication, 
  onEdit, 
  onDelete 
}: { 
  communication: Communication
  onEdit: (comm: Communication) => void
  onDelete: (id: string) => void 
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Reunião': return <Users className="w-4 h-4" />
      case 'E-mail': return <Mail className="w-4 h-4" />
      case 'Decisão': return <CheckCircle className="w-4 h-4" />
      case 'Escalação': return <AlertTriangle className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Reunião': return 'bg-blue-100 text-blue-700'
      case 'E-mail': return 'bg-green-100 text-green-700'
      case 'Decisão': return 'bg-purple-100 text-purple-700'
      case 'Escalação': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positivo': return <ThumbsUp className="w-4 h-4 text-green-600" />
      case 'negativo': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <div className="w-4 h-4 rounded-full bg-gray-400"></div>
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(communication.type)}`}>
            {getTypeIcon(communication.type)}
            <span>{communication.type}</span>
          </div>
          {getSentimentIcon(communication.sentiment)}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(communication)}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(communication.id)}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">{communication.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{communication.content}</p>
        
        {/* Participants */}
        {communication.participants.length > 0 && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>{communication.participants.join(', ')}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{new Date(communication.communication_date).toLocaleDateString('pt-BR')}</span>
        </div>

        {/* Follow-up actions */}
        {communication.follow_up_actions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Ações de follow-up:</div>
            <ul className="text-xs text-gray-600 space-y-1">
              {communication.follow_up_actions.slice(0, 2).map((action, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-gray-400">•</span>
                  <span>{action}</span>
                </li>
              ))}
              {communication.follow_up_actions.length > 2 && (
                <li className="text-gray-400">+{communication.follow_up_actions.length - 2} mais...</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// === MODAL DE COMUNICAÇÃO ===
const CommunicationModal = ({ 
  isOpen, 
  onClose, 
  communication, 
  teamMembers = [],
  projectId,
  onSuccess 
}: {
  isOpen: boolean
  onClose: () => void
  communication: Communication | null
  teamMembers: TeamMember[]
  projectId: string
  onSuccess: (newCommunication?: Communication) => void
}) => {
  const [formData, setFormData] = useState({
    type: 'Reunião' as Communication['type'],
    title: '',
    content: '',
    participants: [] as string[],
    follow_up_actions: '',
    sentiment: 'neutro' as Communication['sentiment'],
    communication_date: new Date().toISOString().split('T')[0]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Log para debug - movido para fora do JSX
  useEffect(() => {
    console.log('🔍 CommunicationModal - teamMembers recebidos:', teamMembers)
    console.log('🎯 teamMembers.length:', teamMembers?.length || 0)
  }, [teamMembers])

  // Dados simulados para quando não há membros reais
  const mockTeamMembers = [
    { id: '1', full_name: 'Eduarda Simas', email: 'eduarda@opone.com', primary_specialization: 'Produto' },
    { id: '2', full_name: 'Carlos Leal', email: 'carlos@opone.com', primary_specialization: 'Machine Learning/IA' }
  ]

  // Usar dados reais se disponíveis, senão usar mock
  const availableMembers = teamMembers && teamMembers.length > 0 ? teamMembers : mockTeamMembers

  useEffect(() => {
    if (communication) {
      setFormData({
        type: communication.type,
        title: communication.title,
        content: communication.content,
        participants: communication.participants,
        follow_up_actions: communication.follow_up_actions.join('\n'),
        sentiment: communication.sentiment,
        communication_date: communication.communication_date
      })
    } else {
      setFormData({
        type: 'Reunião',
        title: '',
        content: '',
        participants: [],
        follow_up_actions: '',
        sentiment: 'neutro',
        communication_date: new Date().toISOString().split('T')[0]
      })
    }
  }, [communication, isOpen])

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Título e resumo são obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      const newCommunication: Communication = {
        id: Date.now().toString(),
        project_id: projectId,
        type: formData.type,
        title: formData.title,
        content: formData.content,
        participants: formData.participants,
        follow_up_actions: formData.follow_up_actions.split('\n').filter(action => action.trim()),
        sentiment: formData.sentiment,
        communication_date: formData.communication_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      onSuccess(newCommunication)
      alert(communication ? 'Comunicação atualizada!' : 'Comunicação criada!')
      onClose()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao salvar comunicação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleParticipantToggle = (memberName: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(memberName)
        ? prev.participants.filter(p => p !== memberName)
        : [...prev.participants, memberName]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {communication ? 'Editar Comunicação' : 'Nova Comunicação'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tipo e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Communication['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="Reunião">Reunião</option>
                <option value="E-mail">E-mail</option>
                <option value="Decisão">Decisão</option>
                <option value="Escalação">Escalação</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <input
                type="date"
                value={formData.communication_date}
                onChange={(e) => setFormData(prev => ({ ...prev, communication_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Assunto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Ex: Reunião de alinhamento do projeto"
            />
          </div>

          {/* Participantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participantes (selecione da equipe)
            </label>
            <div className="border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto bg-white">
              {availableMembers && availableMembers.length > 0 ? (
                availableMembers.map(member => (
                  <label key={member.id} className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.participants.includes(member.full_name)}
                      onChange={() => handleParticipantToggle(member.full_name)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{member.full_name}</span>
                    <span className="text-xs text-gray-500">({member.primary_specialization})</span>
                  </label>
                ))
              ) : (
                <div className="text-sm text-gray-500 py-2">
                  Nenhum membro da equipe encontrado
                  <br />
                  <span className="text-xs">Debug: teamMembers.length = {teamMembers?.length || 0}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecionados: {formData.participants.join(', ') || 'Nenhum'}
            </p>
          </div>

          {/* Resumo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resumo</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Descreva o que foi discutido, decidido ou comunicado..."
            />
          </div>

          {/* Ações de Follow-up */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ações de Follow-up (uma por linha)
            </label>
            <textarea
              value={formData.follow_up_actions}
              onChange={(e) => setFormData(prev => ({ ...prev, follow_up_actions: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Finalizar documento&#10;Preparar apresentação&#10;Agendar próxima reunião"
            />
          </div>

          {/* Sentimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sentimento da Comunicação
            </label>
            <select
              value={formData.sentiment}
              onChange={(e) => setFormData(prev => ({ ...prev, sentiment: e.target.value as Communication['sentiment'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="negativo">Negativo</option>
              <option value="neutro">Neutro</option>
              <option value="positivo">Positivo</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// === COMPONENTE PRINCIPAL ===
export const CommunicationTab = ({ projectId, teamMembers = [], loading = false }: CommunicationTabProps) => {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null)
  const [filterType, setFilterType] = useState('Todos os tipos')

  // Debug logs - movidos para useEffect
  useEffect(() => {
    console.log('🔍 CommunicationTab - Debug logs:')
    console.log('📥 teamMembers prop:', teamMembers)
    console.log('🎯 teamMembers.length:', teamMembers?.length || 0)
  }, [teamMembers])

  // Carregar comunicações (mock data por enquanto)
  useEffect(() => {
    setCommunications(mockCommunications)
  }, [projectId])

  // Filtrar comunicações
  const filteredCommunications = communications.filter(comm => 
    filterType === 'Todos os tipos' || comm.type === filterType
  )

  // Estatísticas
  const stats = {
    meetings: communications.filter(c => c.type === 'Reunião').length,
    decisions: communications.filter(c => c.type === 'Decisão').length,
    escalations: communications.filter(c => c.type === 'Escalação').length,
    positivePercent: communications.length > 0 
      ? Math.round((communications.filter(c => c.sentiment === 'positivo').length / communications.length) * 100)
      : 0
  }

  const handleNewCommunication = () => {
    setEditingCommunication(null)
    setIsModalOpen(true)
  }

  const handleEditCommunication = (communication: Communication) => {
    setEditingCommunication(communication)
    setIsModalOpen(true)
  }

  const handleDeleteCommunication = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta comunicação?')) {
      setCommunications(prev => prev.filter(c => c.id !== id))
    }
  }

  const handleModalSuccess = (newCommunication?: Communication) => {
    if (newCommunication) {
      if (editingCommunication) {
        setCommunications(prev => 
          prev.map(c => c.id === editingCommunication.id ? newCommunication : c)
        )
      } else {
        setCommunications(prev => [newCommunication, ...prev])
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Reuniões</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.meetings}</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Decisões</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.decisions}</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">Escalações</span>
          </div>
          <div className="text-2xl font-bold text-red-900">{stats.escalations}</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Sentimento+</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.positivePercent}%</div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Todos os tipos">Todos os tipos</option>
              <option value="Reunião">Reunião</option>
              <option value="E-mail">E-mail</option>
              <option value="Decisão">Decisão</option>
              <option value="Escalação">Escalação</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleNewCommunication}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Comunicação</span>
        </button>
      </div>

      {/* Lista de comunicações */}
      <div className="space-y-4">
        {filteredCommunications.length > 0 ? (
          filteredCommunications.map(communication => (
            <CommunicationCard
              key={communication.id}
              communication={communication}
              onEdit={handleEditCommunication}
              onDelete={handleDeleteCommunication}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma comunicação registrada</h3>
            <p className="text-gray-500 mb-4">
              Comece criando um registro de reunião, decisão ou comunicação do projeto.
            </p>
            <button
              onClick={handleNewCommunication}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Primeira Comunicação</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <CommunicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        communication={editingCommunication}
        teamMembers={teamMembers}
        projectId={projectId}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}