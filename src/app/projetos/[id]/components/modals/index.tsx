// src/app/projetos/[id]/components/modals/index.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Target, FileText, Calendar, User } from 'lucide-react'
import { 
  MilestoneFormData, 
  ActivityFormData, 
  TeamMember, 
  Milestone, 
  Activity,
  MILESTONE_STATUSES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES
} from '../../types/project.types'

// === MODAL NOVO MARCO ===
interface NewMilestoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: MilestoneFormData) => void
  teamMembers: TeamMember[]
}

export const NewMilestoneModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  teamMembers 
}: NewMilestoneModalProps) => {
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    description: '',
    responsible_id: '',
    deadline: '',
    status: 'pending'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Título é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        title: '',
        description: '',
        responsible_id: '',
        deadline: '',
        status: 'pending'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Novo Marco</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título do marco..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={isSubmitting}
            >
              {MILESTONE_STATUSES.map((status) => (
                <option key={status.value} value={status.value} className="text-gray-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Responsável
            </label>
            <select
              value={formData.responsible_id}
              onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={isSubmitting}
            >
              <option value="" className="text-gray-500">Selecione um responsável</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id} className="text-gray-900">
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o marco..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500 bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prazo
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                disabled={isSubmitting}
              />
              <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Criando...' : 'Criar Marco'}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// === MODAL NOVA ATIVIDADE ===
interface NewActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: ActivityFormData) => void
  teamMembers: TeamMember[]
}

export const NewActivityModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  teamMembers 
}: NewActivityModalProps) => {
  const [formData, setFormData] = useState<ActivityFormData>({
    title: '',
    description: '',
    category: 'documentation',
    responsible_id: '',
    deadline: '',
    status: 'draft'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Título é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        title: '',
        description: '',
        category: 'documentation',
        responsible_id: '',
        deadline: '',
        status: 'draft'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Nova Atividade</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da atividade..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={isSubmitting}
            >
              {ACTIVITY_STATUSES.map((status) => (
                <option key={status.value} value={status.value} className="text-gray-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={isSubmitting}
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.value} value={type.value} className="text-gray-900">
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Responsável
            </label>
            <select
              value={formData.responsible_id}
              onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={isSubmitting}
            >
              <option value="" className="text-gray-500">Selecione um responsável</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id} className="text-gray-900">
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a atividade..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500 bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prazo
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                disabled={isSubmitting}
              />
              <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Criando...' : 'Criar Atividade'}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// === MODAL EDITAR ITEM ===
interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => void
  item: (Milestone | Activity) & { type?: 'marco' | 'atividade' } | null
  teamMembers: TeamMember[]
}

export const EditItemModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  item, 
  teamMembers 
}: EditItemModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    status: '',
    category: 'documentation',
    responsible_id: '',
    progress: 0
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // CORREÇÃO CRÍTICA: Usar useEffect em vez de useState
  useEffect(() => {
    console.log('🔍 EditItemModal useEffect - isOpen:', isOpen, 'item:', item)
    
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        title: '',
        description: '',
        deadline: '',
        status: '',
        category: 'documentation',
        responsible_id: '',
        progress: 0
      })
      return
    }

    if (!item) {
      console.log('❌ Nenhum item fornecido')
      return
    }

    console.log('📋 Carregando dados do item:', {
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      due_date: item.due_date,
      deadline: (item as any).deadline,
      assigned_to: (item as any).assigned_to,
      responsible_id: (item as any).responsible_id,
      progress_percentage: (item as Milestone).progress_percentage
    })

    // Processar deadline
    const rawDeadline = item.due_date || (item as any).deadline
    let formattedDeadline = ''
    
    if (rawDeadline) {
      try {
        const date = new Date(rawDeadline)
        if (!isNaN(date.getTime())) {
          formattedDeadline = date.toISOString().split('T')[0]
        }
      } catch (error) {
        console.log('❌ Erro ao formatar data:', error)
      }
    }

    // Processar responsável
    const responsibleId = (item as any).assigned_to || (item as any).responsible_id || ''

    // Processar status
    const isMilestone = item.type === 'marco'
    const defaultStatus = isMilestone ? 'pending' : 'draft'
    const status = item.status || defaultStatus

    // Processar categoria (apenas para atividades)
    const category = (item as Activity).type || (item as Activity).category || 'documentation'

    // Processar progresso (apenas para marcos)
    const progress = (item as Milestone).progress_percentage || 0

    const newFormData = {
      title: item.title || '',
      description: item.description || '',
      deadline: formattedDeadline,
      status: status,
      category: category,
      responsible_id: responsibleId,
      progress: progress
    }

    console.log('✅ Dados do formulário definidos:', newFormData)
    setFormData(newFormData)
  }, [isOpen, item]) // Dependencies corretas

  const handleSubmit = async () => {
    console.log('📤 Enviando formulário com dados:', formData)
    
    if (!formData.title.trim()) {
      alert('Título é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose() // Fechar modal após sucesso
    } catch (error) {
      console.error('❌ Erro ao enviar formulário:', error)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !item) return null

  const isMilestone = item.type === 'marco'
  console.log('🎯 Renderizando modal para:', isMilestone ? 'Marco' : 'Atividade')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isMilestone ? 'bg-purple-100' : 'bg-blue-100'}`}>
              {isMilestone ? (
                <Target className="w-5 h-5 text-purple-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Editar {isMilestone ? 'Marco' : 'Atividade'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={isSubmitting}
            >
              {(isMilestone ? MILESTONE_STATUSES : ACTIVITY_STATUSES).map((status) => (
                <option key={status.value} value={status.value} className="text-gray-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Progress (apenas para marcos) */}
          {isMilestone && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Progresso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: Number(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Categoria (apenas para atividades) */}
          {!isMilestone && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                disabled={isSubmitting}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="text-gray-900">
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Responsável
            </label>
            <select
              value={formData.responsible_id}
              onChange={(e) => setFormData(prev => ({ ...prev, responsible_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={isSubmitting}
            >
              <option value="" className="text-gray-500">Selecione um responsável</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id} className="text-gray-900">
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500 bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prazo
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                disabled={isSubmitting}
              />
              <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Debug Info (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-gray-100 rounded-lg text-xs overflow-auto max-h-32">
              <strong className="text-gray-900">Debug Info:</strong>
              <pre className="mt-1 text-gray-700 whitespace-pre-wrap">
                {JSON.stringify({ 
                  itemType: item.type,
                  itemId: item.id,
                  itemTitle: item.title,
                  formDataTitle: formData.title,
                  formDataStatus: formData.status,
                  formDataDeadline: formData.deadline,
                  formDataResponsible: formData.responsible_id
                }, null, 2)}
              </pre>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}