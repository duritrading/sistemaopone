// src/components/modals/OpportunityDetailsModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { SalesOpportunity, SalesActivity, ActivityType } from '@/types/sales'
import { 
  X, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Target, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Briefcase,
  Plus,
  Clock,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  Send,
  Edit3,
  ArrowRight
} from 'lucide-react'

interface OpportunityDetailsModalProps {
  isOpen: boolean
  opportunity: SalesOpportunity | null
  onClose: () => void
  onEdit: (opportunity: SalesOpportunity) => void
  onSuccess: () => void
}

// Schema para nova atividade
const newActivitySchema = z.object({
  activity_type: z.enum(['Ligação', 'Email', 'Reunião', 'Proposta', 'Seguimento', 'Nota', 'Mudança de Stage']),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres')
})

type NewActivityForm = z.infer<typeof newActivitySchema>

const activityTypeIcons: Record<ActivityType, React.ComponentType<any>> = {
  'Ligação': PhoneCall,
  'Email': Mail,
  'Reunião': Video,
  'Proposta': FileText,
  'Seguimento': ArrowRight,
  'Nota': MessageSquare,
  'Mudança de Stage': TrendingUp
}

const activityTypeColors: Record<ActivityType, string> = {
  'Ligação': 'bg-green-100 text-green-800',
  'Email': 'bg-blue-100 text-blue-800',
  'Reunião': 'bg-purple-100 text-purple-800',
  'Proposta': 'bg-orange-100 text-orange-800',
  'Seguimento': 'bg-yellow-100 text-yellow-800',
  'Nota': 'bg-gray-100 text-gray-800',
  'Mudança de Stage': 'bg-indigo-100 text-indigo-800'
}

export default function OpportunityDetailsModal({ 
  isOpen, 
  opportunity, 
  onClose, 
  onEdit, 
  onSuccess 
}: OpportunityDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activities'>('details')
  const [activities, setActivities] = useState<SalesActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false)

  const {
    register: registerActivity,
    handleSubmit: handleSubmitActivity,
    formState: { errors: activityErrors },
    reset: resetActivity
  } = useForm<NewActivityForm>({
    resolver: zodResolver(newActivitySchema),
    defaultValues: {
      activity_type: 'Nota'
    }
  })

  // Buscar atividades quando modal abre
  useEffect(() => {
    if (isOpen && opportunity) {
      fetchActivities()
    }
  }, [isOpen, opportunity])

  const fetchActivities = async () => {
    if (!opportunity) return
    
    setLoadingActivities(true)
    try {
      const { data, error } = await supabase
        .from('sales_activities')
        .select(`
          *,
          creator:team_members(id, full_name, email)
        `)
        .eq('opportunity_id', opportunity.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const onSubmitActivity = async (data: NewActivityForm) => {
    if (!opportunity) return
    
    setIsSubmittingActivity(true)
    try {
      const { error } = await supabase
        .from('sales_activities')
        .insert([{
          opportunity_id: opportunity.id,
          activity_type: data.activity_type,
          title: data.title,
          description: data.description,
          created_by: null // Aqui seria o ID do usuário logado
        }])

      if (error) throw error

      // Reset form and refresh activities
      resetActivity()
      setShowAddActivity(false)
      await fetchActivities()
      onSuccess()
      
    } catch (error) {
      console.error('Erro ao criar atividade:', error)
      alert('Erro ao criar atividade. Tente novamente.')
    } finally {
      setIsSubmittingActivity(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Lead Qualificado': 'bg-blue-100 text-blue-800',
      'Proposta Enviada': 'bg-yellow-100 text-yellow-800',
      'Negociação': 'bg-orange-100 text-orange-800',
      'Proposta Aceita': 'bg-purple-100 text-purple-800',
      'Contrato Assinado': 'bg-green-100 text-green-800',
      'Perdido': 'bg-red-100 text-red-800'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen || !opportunity) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {opportunity.opportunity_title}
              </h3>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-1" />
                  {opportunity.company_name}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(opportunity.stage)}`}>
                  {opportunity.stage}
                </span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(opportunity.estimated_value)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onEdit(opportunity)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="h-4 w-4 inline mr-2" />
                Detalhes
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Atividades ({activities.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'details' && (
              <div className="p-6 space-y-8">
                {/* Informações da Empresa */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Informações da Empresa
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                        <p className="mt-1 text-sm text-gray-900">{opportunity.company_name}</p>
                      </div>
                      {opportunity.company_cnpj && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                          <p className="mt-1 text-sm text-gray-900">{opportunity.company_cnpj}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contato</label>
                        <p className="mt-1 text-sm text-gray-900">{opportunity.contact_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{opportunity.contact_email}</p>
                      </div>
                      {opportunity.contact_phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Telefone</label>
                          <p className="mt-1 text-sm text-gray-900">{opportunity.contact_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhes da Oportunidade */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Detalhes da Oportunidade
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <p className="mt-1 text-sm text-gray-900">{opportunity.description || 'Nenhuma descrição fornecida'}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Valor Estimado</label>
                          <p className="mt-1 text-lg font-semibold text-green-600">
                            {formatCurrency(opportunity.estimated_value)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Probabilidade</label>
                          <p className="mt-1 text-sm text-gray-900">{opportunity.probability_percentage}%</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data Prevista</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(opportunity.expected_close_date)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Origem do Lead</label>
                          <p className="mt-1 text-sm text-gray-900">{opportunity.lead_source || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Responsável</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {opportunity.team_member?.full_name || 'Não atribuído'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Criado em</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDateTime(opportunity.created_at)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Última atualização</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDateTime(opportunity.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="p-6">
                {/* Header das atividades */}
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-medium text-gray-900">
                    Histórico de Atividades
                  </h4>
                  <button
                    onClick={() => setShowAddActivity(!showAddActivity)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Atividade
                  </button>
                </div>

                {/* Formulário de nova atividade */}
                {showAddActivity && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Adicionar Nova Atividade</h5>
                    <form onSubmit={handleSubmitActivity(onSubmitActivity)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Atividade
                          </label>
                          <select
                            {...registerActivity('activity_type')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Nota">Nota</option>
                            <option value="Ligação">Ligação</option>
                            <option value="Email">Email</option>
                            <option value="Reunião">Reunião</option>
                            <option value="Proposta">Proposta</option>
                            <option value="Seguimento">Seguimento</option>
                          </select>
                          {activityErrors.activity_type && (
                            <p className="mt-1 text-sm text-red-600">{activityErrors.activity_type.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título
                          </label>
                          <input
                            type="text"
                            {...registerActivity('title')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Reunião de apresentação"
                          />
                          {activityErrors.title && (
                            <p className="mt-1 text-sm text-red-600">{activityErrors.title.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <textarea
                          rows={3}
                          {...registerActivity('description')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Descreva os detalhes da atividade..."
                        />
                        {activityErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{activityErrors.description.message}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddActivity(false)
                            resetActivity()
                          }}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingActivity}
                          className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSubmittingActivity ? 'Salvando...' : 'Salvar Atividade'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Lista de atividades */}
                <div className="space-y-4">
                  {loadingActivities ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Carregando atividades...</p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Comece adicionando uma nova atividade para esta oportunidade.
                      </p>
                    </div>
                  ) : (
                    activities.map((activity) => {
                      const IconComponent = activityTypeIcons[activity.activity_type as ActivityType]
                      return (
                        <div key={activity.id} className="flex space-x-4 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activityTypeColors[activity.activity_type as ActivityType]}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(activity.activity_date)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                            {activity.creator && (
                              <p className="mt-2 text-xs text-gray-500">
                                por {activity.creator.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}