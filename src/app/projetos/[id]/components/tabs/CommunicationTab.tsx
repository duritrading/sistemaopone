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
  primary_specialization: string
}

interface CommunicationTabProps {
  projectId: string
  teamMembers: TeamMember[]
}

// === MOCK DATA (comentado para integração real) ===
// const mockCommunications: Communication[] = []

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
      default: return <div className="w-4 h-4 rounded-full bg-gray-400" />
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getSentimentIcon(communication.sentiment)}
          <div>
            <h3 className="font-semibold text-gray-900">{communication.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(communication.type)}`}>
                {getTypeIcon(communication.type)}
                <span className="ml-1">{communication.type}</span>
              </span>
              <span className="text-xs text-gray-500">
                {communication.sentiment}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(communication)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(communication.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(communication.communication_date).toLocaleDateString('pt-BR')}
          <span className="ml-4">Participantes: {communication.participants.join(', ')}</span>
        </div>
        <p className="text-gray-700 text-sm">{communication.content}</p>
      </div>

      {communication.follow_up_actions.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Ações de Follow-up:</h4>
          <ul className="space-y-1">
            {communication.follow_up_actions.map((action, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const CommunicationModal = ({ 
  isOpen, 
  onClose, 
  teamMembers, 
  projectId,
  communication = null,
  onSuccess 
}: {
  isOpen: boolean
  onClose: () => void
  teamMembers: TeamMember[]
  projectId: string
  communication?: Communication | null
  onSuccess: () => void
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
      // Aqui implementar a lógica do Supabase
      // const { error } = await supabase.from('project_communications')...
      
      alert(communication ? 'Comunicação atualizada!' : 'Comunicação criada!')
      onSuccess()
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {communication ? 'Editar Comunicação' : 'Nova Comunicação'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          <div className="p-6 space-y-4 overflow-y-auto">
            
            {/* Tipo e Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Communication['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Reunião de alinhamento do projeto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participantes (selecione da equipe)
              </label>
              <div className="border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto">
                {teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map(member => (
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="negativo">Negativo</option>
                <option value="neutro">Neutro</option>
                <option value="positivo">Positivo</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// === COMPONENTE PRINCIPAL ===
export const CommunicationTab = ({ projectId, teamMembers }: CommunicationTabProps) => {
  const [communications, setCommunications] = useState<Communication[]>(mockCommunications)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null)
  const [filterType, setFilterType] = useState('Todos os tipos')

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

  const handleEdit = (communication: Communication) => {
    setEditingCommunication(communication)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta comunicação?')) {
      // Implementar delete no Supabase
      setCommunications(prev => prev.filter(c => c.id !== id))
      alert('Comunicação excluída!')
    }
  }

  const handleModalSuccess = () => {
    // Recarregar dados
    setEditingCommunication(null)
  }

  const openNewModal = () => {
    setEditingCommunication(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Comunicação
            </h2>
            <p className="text-gray-600 text-sm">Timeline de comunicação do projeto</p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Comunicação</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Filtrar por tipo:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Todos os tipos">Todos os tipos</option>
            <option value="Reunião">Reunião</option>
            <option value="E-mail">E-mail</option>
            <option value="Decisão">Decisão</option>
            <option value="Escalação">Escalação</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.meetings}</span>
            </div>
            <p className="text-sm text-gray-600">Reuniões</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.decisions}</span>
            </div>
            <p className="text-sm text-gray-600">Decisões</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.escalations}</span>
            </div>
            <p className="text-sm text-gray-600">Escalações</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{stats.positivePercent}%</span>
            </div>
            <p className="text-sm text-gray-600">Positivas</p>
          </div>
        </div>
      </div>

      {/* Timeline de Comunicações */}
      <div className="space-y-4">
        {filteredCommunications.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma comunicação encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {filterType === 'Todos os tipos' 
                ? 'Comece registrando a primeira comunicação do projeto.'
                : `Nenhuma comunicação do tipo "${filterType}" foi encontrada.`
              }
            </p>
            <button
              onClick={openNewModal}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Comunicação</span>
            </button>
          </div>
        ) : (
          filteredCommunications.map(communication => (
            <CommunicationCard
              key={communication.id}
              communication={communication}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Modal */}
      <CommunicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamMembers={teamMembers}
        projectId={projectId}
        communication={editingCommunication}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default CommunicationTab