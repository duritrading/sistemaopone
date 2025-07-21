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
  TrendingUp,
  Loader2,
  Video
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Communication {
  id: string
  title: string
  content: string
  type: 'Reunião' | 'Email' | 'Ligação' | 'Decisão' | 'Escalação' | 'Nota'
  sentiment: 'Positivo' | 'Neutro' | 'Negativo'
  communication_date: string
  participants: string[]
  follow_up_actions: string[]
  created_at: string
}

interface CommunicationTabProps {
  projectId: string
  loading?: boolean
}

interface CommunicationModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  communication?: Communication | null
  onSuccess: () => void
}

// Modal para Nova/Editar Comunicação
const CommunicationModal = ({ isOpen, onClose, projectId, communication, onSuccess }: CommunicationModalProps) => {
  const [formData, setFormData] = useState({
    type: 'Nota' as Communication['type'],
    title: '',
    content: '',
    participants: '',
    follow_up_actions: '',
    sentiment: 'Neutro' as Communication['sentiment']
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!communication

  useEffect(() => {
    if (isOpen && communication) {
      setFormData({
        type: communication.type,
        title: communication.title,
        content: communication.content,
        participants: communication.participants.join(', '),
        follow_up_actions: communication.follow_up_actions.join('\n'),
        sentiment: communication.sentiment
      })
    } else if (isOpen && !communication) {
      setFormData({
        type: 'Nota',
        title: '',
        content: '',
        participants: '',
        follow_up_actions: '',
        sentiment: 'Neutro'
      })
    }
  }, [isOpen, communication])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Título e conteúdo são obrigatórios')
      return
    }

    setIsSubmitting(true)
    
    try {
      const participantsArray = formData.participants 
        ? formData.participants.split(',').map(p => p.trim()).filter(p => p)
        : []
      
      const followUpActions = formData.follow_up_actions
        ? formData.follow_up_actions.split('\n').map(a => a.trim()).filter(a => a)
        : []

      const payload = {
        project_id: projectId,
        type: formData.type,
        title: formData.title.trim(),
        content: formData.content.trim(),
        participants: participantsArray,
        follow_up_actions: followUpActions,
        sentiment: formData.sentiment,
        communication_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (isEditing) {
        const { error } = await supabase
          .from('project_communications')
          .update(payload)
          .eq('id', communication.id)
      } else {
        const { error } = await supabase
          .from('project_communications')
          .insert([{ ...payload, created_at: new Date().toISOString() }])
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar comunicação:', err)
      alert(`Erro ao ${isEditing ? 'atualizar' : 'criar'} comunicação: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const communicationTypes = [
    { value: 'Reunião', label: 'Reunião', icon: Users },
    { value: 'Email', label: 'Email', icon: Mail },
    { value: 'Ligação', label: 'Ligação', icon: Phone },
    { value: 'Decisão', label: 'Decisão', icon: FileText },
    { value: 'Escalação', label: 'Escalação', icon: AlertTriangle },
    { value: 'Nota', label: 'Nota', icon: MessageSquare }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Comunicação' : 'Nova Comunicação'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Communication['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-gray-700 focus:border-blue-500"
              >
                {communicationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sentimento</label>
              <select
                value={formData.sentiment}
                onChange={(e) => setFormData(prev => ({ ...prev, sentiment: e.target.value as Communication['sentiment'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-gray-700 focus:border-blue-500"
              >
                <option value="Positivo">Positivo</option>
                <option value="Neutro">Neutro</option>
                <option value="Negativo">Negativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-gray-700 focus:border-blue-500"
              placeholder="Ex: Reunião de alinhamento semanal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-gray-700 focus:border-blue-500"
              placeholder="Descreva o que foi discutido ou decidido..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Participantes</label>
            <input
              type="text"
              value={formData.participants}
              onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-gray-700 focus:border-blue-500"
              placeholder="Ex: João Silva, Maria Santos (separados por vírgula)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ações de Follow-up</label>
            <textarea
              value={formData.follow_up_actions}
              onChange={(e) => setFormData(prev => ({ ...prev, follow_up_actions: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-gray-700 focus:border-blue-500"
              placeholder="Uma ação por linha..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-gray-700 flex items-center space-x-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente principal
const CommunicationTab = ({ projectId, loading = false }: CommunicationTabProps) => {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null)
  const [filterType, setFilterType] = useState('Todos os tipos')
  const [loadingComms, setLoadingComms] = useState(true)

  const loadCommunications = async () => {
    try {
      setLoadingComms(true)
      const { data, error } = await supabase
        .from('project_communications')
        .select('*')
        .eq('project_id', projectId)
        .order('communication_date', { ascending: false })

      if (error) throw error
      setCommunications(data || [])
    } catch (err) {
      console.error('Erro ao carregar comunicações:', err)
    } finally {
      setLoadingComms(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadCommunications()
    }
  }, [projectId])

  const filteredCommunications = communications.filter(comm => 
    filterType === 'Todos os tipos' || comm.type === filterType
  )

  const handleNewCommunication = () => {
    setEditingCommunication(null)
    setIsModalOpen(true)
  }

  const handleEditCommunication = (communication: Communication) => {
    setEditingCommunication(communication)
    setIsModalOpen(true)
  }

  const handleDeleteCommunication = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${title}"?`)) return

    try {
      const { error } = await supabase
        .from('project_communications')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setCommunications(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      console.error('Erro ao excluir comunicação:', err)
      alert('Erro ao excluir comunicação: ' + err.message)
    }
  }

  const handleCommunicationSuccess = () => {
    setIsModalOpen(false)
    setEditingCommunication(null)
    loadCommunications()
  }

  const getTypeIcon = (type: Communication['type']) => {
    switch (type) {
      case 'Reunião': return <Users className="w-4 h-4" />
      case 'Email': return <Mail className="w-4 h-4" />
      case 'Ligação': return <Phone className="w-4 h-4" />
      case 'Decisão': return <FileText className="w-4 h-4" />
      case 'Escalação': return <AlertTriangle className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: Communication['type']) => {
    switch (type) {
      case 'Reunião': return 'bg-blue-100 text-blue-800'
      case 'Email': return 'bg-green-100 text-green-800'
      case 'Ligação': return 'bg-purple-100 text-purple-800'
      case 'Decisão': return 'bg-orange-100 text-orange-800'
      case 'Escalação': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentIcon = (sentiment: Communication['sentiment']) => {
    switch (sentiment) {
      case 'Positivo': return <span className="text-green-600">😊</span>
      case 'Negativo': return <span className="text-red-600">😞</span>
      default: return <span className="text-yellow-600">😐</span>
    }
  }

  const stats = {
    total: communications.length,
    meetings: communications.filter(c => c.type === 'Reunião').length,
    decisions: communications.filter(c => c.type === 'Decisão').length,
    escalations: communications.filter(c => c.type === 'Escalação').length,
    positivePercent: communications.length > 0 
      ? Math.round((communications.filter(c => c.sentiment === 'Positivo').length / communications.length) * 100)
      : 0
  }

  if (loading || loadingComms) {
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
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Reuniões</div>
              <div className="text-2xl font-bold text-blue-900">{stats.meetings}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Decisões</div>
              <div className="text-2xl font-bold text-orange-900">{stats.decisions}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Sentimento+</div>
              <div className="text-2xl font-bold text-green-900">{stats.positivePercent}%</div>
            </div>
          </div>
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
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 text-gray-700 focus:border-blue-500"
            >
              <option value="Todos os tipos">Todos os tipos</option>
              <option value="Reunião">Reunião</option>
              <option value="Email">Email</option>
              <option value="Ligação">Ligação</option>
              <option value="Decisão">Decisão</option>
              <option value="Escalação">Escalação</option>
              <option value="Nota">Nota</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleNewCommunication}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Comunicação</span>
        </button>
      </div>

      {/* Lista de comunicações */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Comunicações do Projeto</h3>
          </div>
        </div>

        <div className="p-6">
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
                        onClick={() => handleDeleteCommunication(communication.id, communication.title)}
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
        </div>
      </div>

      {/* Modal */}
      <CommunicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        communication={editingCommunication}
        onSuccess={handleCommunicationSuccess}
      />
    </div>
  )
}

export default CommunicationTab
