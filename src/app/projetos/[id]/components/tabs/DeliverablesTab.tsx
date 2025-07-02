import React, { useState, useEffect } from 'react'
import { Target, FileText, Calendar, X } from 'lucide-react'

// Types
interface TeamMember {
  id: string
  full_name: string
  email: string
  primary_specialization?: string
}

interface Milestone {
  id: string
  title: string
  description?: string
  status: string
  due_date?: string
  deadline?: string
  assigned_to?: string
  responsible_id?: string
  progress_percentage?: number
  responsible?: { 
    id?: string
    full_name: string 
  }
}

interface Activity {
  id: string
  title: string
  description?: string
  status: string
  type?: string
  category?: string
  due_date?: string
  deadline?: string
  assigned_to?: string
  responsible_id?: string
  responsible?: { 
    id?: string
    full_name: string 
  }
}

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => void
  item: (Milestone | Activity) & { type?: 'marco' | 'atividade' } | null
  teamMembers: TeamMember[]
}

// Constants
const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'delayed', label: 'Atrasado' },
  { value: 'cancelled', label: 'Cancelado' }
]

const ACTIVITY_STATUSES = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'review', label: 'Em Revisão' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' }
]

const ACTIVITY_TYPES = [
  { value: 'documentation', label: 'Documentação' },
  { value: 'code', label: 'Código' },
  { value: 'interface', label: 'Interface' },
  { value: 'testing', label: 'Teste' },
  { value: 'infrastructure', label: 'Infraestrutura' },
  { value: 'analysis', label: 'Análise' }
]

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

  // ✅ CORREÇÃO 1: useEffect para preencher dados do item
  useEffect(() => {
    if (item && isOpen) {
      console.log('📝 Preenchendo dados do item:', item)
      
      // Converter data para formato yyyy-mm-dd se existir
      const formatDateForInput = (dateString?: string) => {
        if (!dateString) return ''
        try {
          const date = new Date(dateString)
          return date.toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      setFormData({
        title: item.title || '',
        description: item.description || '',
        deadline: formatDateForInput(item.due_date || (item as any).deadline),
        status: item.status || (item.type === 'marco' ? 'pending' : 'draft'),
        category: (item as Activity).type || (item as Activity).category || 'documentation',
        responsible_id: (item as any).assigned_to || (item as any).responsible_id || '',
        progress: (item as Milestone).progress_percentage || 0
      })
    }
  }, [item, isOpen])

  // Limpar form quando modal fechar
  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen])

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Título é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      // Converter dados do formulário para o formato esperado
      const submitData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        deadline: formData.deadline || null,
        status: formData.status,
        ...(item?.type === 'marco' ? {
          progress_percentage: formData.progress,
          responsible_id: formData.responsible_id || null
        } : {
          category: formData.category,
          responsible_id: formData.responsible_id || null
        })
      }

      console.log('📤 Enviando dados:', submitData)
      await onSubmit(submitData)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !item) return null

  const isMilestone = item.type === 'marco'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={`Nome do ${isMilestone ? 'marco' : 'atividade'}...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
              disabled={isSubmitting}
            >
              {(isMilestone ? MILESTONE_STATUSES : ACTIVITY_STATUSES).map(status => (
                <option key={status.value} value={status.value} className="text-gray-900">
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Progresso (apenas para marcos) */}
          {isMilestone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progresso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Categoria (apenas para atividades) */}
          {!isMilestone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                disabled={isSubmitting}
              >
                {ACTIVITY_TYPES.map(type => (
                  <option key={type.value} value={type.value} className="text-gray-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável
            </label>
            <select
              value={formData.responsible_id}
              onChange={(e) => setFormData({ ...formData, responsible_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
              disabled={isSubmitting}
            >
              <option value="" className="text-gray-900">Selecione um responsável</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id} className="text-gray-900">
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={`Descreva ${isMilestone ? 'o marco' : 'a atividade'}...`}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prazo
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
                disabled={isSubmitting}
              />
              <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

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
              className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditItemModal