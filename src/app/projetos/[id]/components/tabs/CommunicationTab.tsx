// src/app/projetos/[id]/components/tabs/CommunicationTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  Mail, 
  Phone,
  FileText,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { InfoCard } from '../shared'
import { TeamMember } from '../../types/project.types'

interface Communication {
  id: string
  title: string
  content: string
  type: 'Reunião' | 'E-mail' | 'Decisão' | 'Escalação'
  sentiment: 'positivo' | 'neutro' | 'negativo'
  communication_date: string
  participants: string[]
  follow_up_actions: string[]
  created_at: string
}

interface CommunicationTabProps {
  projectId: string
  teamMembers?: TeamMember[]
  loading?: boolean
}

// Mock data
const mockCommunications: Communication[] = [
  {
    id: '1',
    title: 'Reunião de Kickoff do Projeto',
    content: 'Reunião inicial para alinhamento dos objetivos e definição do escopo do projeto.',
    type: 'Reunião',
    sentiment: 'positivo',
    communication_date: '2024-01-15',
    participants: ['João Silva', 'Maria Santos'],
    follow_up_actions: ['Definir cronograma detalhado', 'Confirmar recursos'],
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Decisão sobre Arquitetura',
    content: 'Decisão tomada sobre a arquitetura tecnológica a ser utilizada no projeto.',
    type: 'Decisão',
    sentiment: 'positivo',
    communication_date: '2024-01-20',
    participants: ['João Silva'],
    follow_up_actions: ['Documentar arquitetura', 'Preparar ambiente'],
    created_at: '2024-01-20T14:30:00Z'
  }
]

const CommunicationTab = ({ projectId, teamMembers = [], loading = false }: CommunicationTabProps) => {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null)
  const [filterType, setFilterType] = useState('Todos os tipos')

  useEffect(() => {
    setCommunications(mockCommunications)
  }, [projectId])

  const filteredCommunications = communications.filter(comm => 
    filterType === 'Todos os tipos' || comm.type === filterType
  )

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

  const getTypeIcon = (type: Communication['type']) => {
    switch (type) {
      case 'Reunião': return <Users className="w-4 h-4" />
      case 'E-mail': return <Mail className="w-4 h-4" />
      case 'Decisão': return <FileText className="w-4 h-4" />
      case 'Escalação': return <AlertTriangle className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: Communication['type']) => {
    switch (type) {
      case 'Reunião': return 'bg-blue-100 text-blue-800'
      case 'E-mail': return 'bg-green-100 text-green-800'
      case 'Decisão': return 'bg-purple-100 text-purple-800'
      case 'Escalação': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentIcon = (sentiment: Communication['sentiment']) => {
    switch (sentiment) {
      case 'positivo': return <span className="text-green-600">😊</span>
      case 'negativo': return <span className="text-red-600">😞</span>
      default: return <span className="text-yellow-600">😐</span>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
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
            <FileText className="w-5 h-5 text-purple-600" />
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
      <InfoCard title="Comunicações do Projeto" icon={MessageSquare}>
        {filteredCommunications.length > 0 ? (
          <div className="space-y-4">
            {filteredCommunications.map(communication => (
              <div key={communication.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
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
                      onClick={() => handleEditCommunication(communication)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCommunication(communication.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">{communication.title}</h3>
                  <p className="text-sm text-gray-600">{communication.content}</p>
                  
                  {communication.participants.length > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{communication.participants.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(communication.communication_date).toLocaleDateString('pt-BR')}</span>
                  </div>

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
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma comunicação registrada
            </h3>
            <p className="text-gray-500 mb-4">
              Comece criando um registro de reunião, decisão ou comunicação do projeto.
            </p>
            <button
              onClick={handleNewCommunication}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Nova Comunicação
            </button>
          </div>
        )}
      </InfoCard>
    </div>
  )
}

export default CommunicationTab