// src/app/projetos/[id]/components/modals/EditItemModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Target, FileText, Calendar } from 'lucide-react'

// Definindo as constantes diretamente no arquivo para evitar problemas de import
const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'delayed', label: 'Atrasado', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-gray-100 text-gray-600' }
]

const ACTIVITY_STATUSES = [
  { value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'Em Progresso', color: 'bg-blue-100 text-blue-800' },
  { value: 'review', label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  { value: 'delivered', label: 'Entregue', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
]

const ACTIVITY_TYPES = [
  { value: 'documentation', label: 'Documento', icon: '📄' },
  { value: 'code', label: 'Código', icon: '💻' },
  { value: 'interface', label: 'Interface', icon: '🎨' },
  { value: 'testing', label: 'Teste', icon: '🧪' },
  { value: 'infrastructure', label: 'Infraestrutura', icon: '⚙️' },
  { value: 'analysis', label: 'Análise', icon: '📊' }
]

interface TeamMember {
  id: string
  full_name: string
  email: string
}

interface BaseItem {
  id: string
  title: string
  description?: string
  status: string
  due_date?: string
  deadline?: string
  assigned_to?: string
  responsible_id?: string
}

interface Milestone extends BaseItem {
  progress_percentage: number
  responsible?: { 
    id?: string
    full_name: string 
  }
}

interface Activity extends BaseItem {
  type?: string
  category?: string
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

  // Função para resetar o formulário
  const resetForm = () => {
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

  // Effect para carregar dados do item quando modal abre
  useEffect(() => {
    console.log('🔍 EditItemModal useEffect - isOpen:', isOpen, 'item:', item)
    
    if (!isOpen) {
      resetForm()
      return
    }

    if (!item) {
      console.log('❌ Nenhum item fornecido')
      resetForm()
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
      responsible_id: (item as any).responsible_id
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
  }, [isOpen, item])

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