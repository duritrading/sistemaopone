// src/app/projetos/[id]/components/modals/EditItemModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Target, FileText, Calendar, User } from 'lucide-react'
import { 
  TeamMember, 
  Milestone, 
  Activity,
  MILESTONE_STATUSES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES
} from '../../types/project.types'

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

  // DEBUG: Console log para verificar item
  useEffect(() => {
    console.log('EditItemModal - Item received:', item)
    console.log('EditItemModal - Modal open:', isOpen)
  }, [item, isOpen])

  // Load form data when item changes - FIXED
  useEffect(() => {
    if (item && isOpen) {
      console.log('Loading form data for item:', item)
      
      // Get deadline with proper formatting
      const deadline = item.due_date || (item as any).deadline || ''
      const formattedDeadline = deadline ? new Date(deadline).toISOString().split('T')[0] : ''
      
      // Get responsible ID
      const responsibleId = (item as any).assigned_to || (item as any).responsible_id || ''
      
      // Get status - handle milestone vs activity defaults
      const status = item.status || (item.type === 'marco' ? 'pending' : 'draft')
      
      // Get category/type for activities
      const category = (item as Activity).type || (item as Activity).category || 'documentation'
      
      // Get progress for milestones
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

      console.log('Setting form data:', newFormData)
      setFormData(newFormData)
    } else if (!isOpen) {
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
    }
  }, [item, isOpen])

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Título é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Submitting form data:', formData)
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    console.log(`Changing ${field} to:`, value)
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen || !item) return null

  const isMilestone = item.type === 'marco'

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
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Digite o título..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
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
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
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
                onChange={(e) => handleInputChange('progress', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
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
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                disabled={isSubmitting}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="text-gray-900">
                    {type.label}
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
              onChange={(e) => handleInputChange('responsible_id', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
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
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
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
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                disabled={isSubmitting}
              />
              <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-gray-100 rounded-lg text-xs">
              <strong>Debug Info:</strong>
              <pre className="mt-1 text-gray-700">
                {JSON.stringify({ 
                  itemType: item.type,
                  itemId: item.id,
                  formData 
                }, null, 2)}
              </pre>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
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