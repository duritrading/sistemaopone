// src/app/projetos/[id]/components/tabs/DeliverablesTab.tsx
'use client'

import { useState, useMemo } from 'react'
import { 
  Target, 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar,
  User,
  AlertCircle
} from 'lucide-react'
import { 
  InfoCard, 
  StatusBadge, 
  ProgressBar, 
  EmptyState, 
  formatDate 
} from '../shared'
import { 
  Milestone, 
  Activity, 
  TeamMember, 
  FilterState,
  MILESTONE_STATUSES,
  ACTIVITY_STATUSES 
} from '../../types/project.types'
import { ProjectUtils } from '../../handlers/ProjectHandlers'

interface DeliverablesTabProps {
  milestones: Milestone[]
  activities: Activity[]
  teamMembers: TeamMember[]
  onNewMilestone: () => void
  onNewActivity: () => void
  onEditMilestone: (milestone: Milestone) => void
  onEditActivity: (activity: Activity) => void
  onDeleteMilestone: (id: string, title: string) => void
  onDeleteActivity: (id: string, title: string) => void
  loading?: boolean
}

export const DeliverablesTab = ({
  milestones,
  activities,
  teamMembers,
  onNewMilestone,
  onNewActivity,
  onEditMilestone,
  onEditActivity,
  onDeleteMilestone,
  onDeleteActivity,
  loading = false
}: DeliverablesTabProps) => {

  // === ESTADOS DE FILTRO ===
  const [filters, setFilters] = useState<FilterState>({
    typeFilter: 'todos',
    responsibleFilter: 'todos',
    statusFilter: 'todos',
    searchTerm: ''
  })

  // === FILTROS APLICADOS ===
  const filteredMilestones = useMemo(() => {
    return milestones.filter(milestone => {
      const matchesSearch = milestone.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           milestone.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      const matchesStatus = filters.statusFilter === 'todos' || milestone.status === filters.statusFilter
      const matchesResponsible = filters.responsibleFilter === 'todos' || 
                                 milestone.assigned_to === filters.responsibleFilter ||
                                 milestone.responsible_id === filters.responsibleFilter
      return matchesSearch && matchesStatus && matchesResponsible
    })
  }, [milestones, filters])

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           activity.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      const matchesStatus = filters.statusFilter === 'todos' || activity.status === filters.statusFilter
      const matchesResponsible = filters.responsibleFilter === 'todos' || 
                                 activity.assigned_to === filters.responsibleFilter ||
                                 activity.responsible_id === filters.responsibleFilter
      return matchesSearch && matchesStatus && matchesResponsible
    })
  }, [activities, filters])

  // === HANDLERS DE FILTRO ===
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      typeFilter: 'todos',
      responsibleFilter: 'todos', 
      statusFilter: 'todos',
      searchTerm: ''
    })
  }

  // === MILESTONE CARD ===
  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const isOverdue = ProjectUtils.isOverdue(milestone.due_date || milestone.deadline, milestone.status)
    const daysUntilDue = ProjectUtils.getDaysUntilDue(milestone.due_date || milestone.deadline)

    return (
      <div className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
        isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-300'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h4 className="text-lg font-medium text-gray-900">{milestone.title}</h4>
              <StatusBadge status={milestone.status} type="milestone" />
              {isOverdue && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Atrasado
                </span>
              )}
            </div>
            
            {milestone.description && (
              <p className="text-gray-700 mb-3">{milestone.description}</p>
            )}
            
            <div className="mb-3">
              <ProgressBar 
                value={milestone.progress_percentage} 
                color="bg-purple-600"
                showLabel={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-900 mr-2" />
                <div>
                  <span className="text-gray-700 font-medium">Prazo:</span>
                  <p className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {formatDate(milestone.due_date || milestone.deadline)}
                    {daysUntilDue !== null && daysUntilDue >= 0 && (
                      <span className="text-xs text-gray-900 ml-1">
                        ({daysUntilDue} dias)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-900 mr-2" />
                <div>
                  <span className="text-gray-700 font-medium">Responsável:</span>
                  <p className="text-gray-900">{milestone.responsible?.full_name || 'Não atribuído'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex space-x-2 ml-4 opacity-80 hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditMilestone(milestone)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar marco"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteMilestone(milestone.id, milestone.title)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir marco"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === ACTIVITY CARD ===
  const ActivityCard = ({ activity }: { activity: Activity }) => {
    const isOverdue = ProjectUtils.isOverdue(activity.due_date || activity.deadline, activity.status)
    const daysUntilDue = ProjectUtils.getDaysUntilDue(activity.due_date || activity.deadline)

    return (
      <div className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
        isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-300'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h4 className="text-lg font-medium text-gray-900">{activity.title}</h4>
              <StatusBadge status={activity.status} type="activity" />
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {ProjectUtils.getTypeIcon(activity.type || activity.category || '')} {ProjectUtils.translateType(activity.type || activity.category || '')}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Atrasado
                </span>
              )}
            </div>
            
            {activity.description && (
              <p className="text-gray-700 mb-3">{activity.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-900 mr-2" />
                <div>
                  <span className="text-gray-700 font-medium">Prazo:</span>
                  <p className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {formatDate(activity.due_date || activity.deadline)}
                    {daysUntilDue !== null && daysUntilDue >= 0 && (
                      <span className="text-xs text-gray-900 ml-1">
                        ({daysUntilDue} dias)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-900 mr-2" />
                <div>
                  <span className="text-gray-700 font-medium">Responsável:</span>
                  <p className="text-gray-900">{activity.responsible?.full_name || 'Não atribuído'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex space-x-2 ml-4 opacity-80 hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditActivity(activity)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar atividade"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteActivity(activity.id, activity.title)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir atividade"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded w-32" />
              <div className="h-10 bg-gray-200 rounded w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-2 bg-gray-200 rounded w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Filtros e Ações */}
      <div className="bg-white rounded-lg border border-gray-300 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 flex-1">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar marcos e atividades..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-400 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 w-64"
              />
            </div>

            {/* Filtro por Status */}
            <select
              value={filters.statusFilter}
              onChange={(e) => updateFilter('statusFilter', e.target.value)}
              className="px-3 py-2 border border-gray-400 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="todos">Todos os Status</option>
              <optgroup label="Status de Marcos">
                {MILESTONE_STATUSES.map(status => (
                  <option key={`milestone-${status.value}`} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Status de Atividades">
                {ACTIVITY_STATUSES.map(status => (
                  <option key={`activity-${status.value}`} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Filtro por Responsável */}
            <select
              value={filters.responsibleFilter}
              onChange={(e) => updateFilter('responsibleFilter', e.target.value)}
              className="px-3 py-2 border border-gray-400 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="todos">Todos os Responsáveis</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.full_name}</option>
              ))}
            </select>

            {/* Limpar Filtros */}
            {(filters.searchTerm || filters.statusFilter !== 'todos' || filters.responsibleFilter !== 'todos') && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Ações */}
          <div className="flex space-x-3">
            <button
              onClick={onNewMilestone}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Marco</span>
            </button>
            <button
              onClick={onNewActivity}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Atividade</span>
            </button>
          </div>
        </div>

        {/* Indicadores de Filtro */}
        {(filteredMilestones.length !== milestones.length || filteredActivities.length !== activities.length) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Filter className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Mostrando {filteredMilestones.length} marco(s) e {filteredActivities.length} atividade(s) 
                de {milestones.length + activities.length} total
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Colunas de Marcos e Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Coluna de Marcos */}
        <InfoCard 
          title={`Marcos (${filteredMilestones.length})`} 
          icon={Target}
        >
          <div className="space-y-4">
            {filteredMilestones.length > 0 ? (
              filteredMilestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))
            ) : milestones.length === 0 ? (
              <EmptyState
                title="Nenhum marco cadastrado"
                description="Crie o primeiro marco para começar a organizar as entregas do projeto."
                icon={Target}
                action={{
                  label: "Criar Primeiro Marco",
                  onClick: onNewMilestone
                }}
              />
            ) : (
              <EmptyState
                title="Nenhum marco encontrado"
                description="Nenhum marco corresponde aos filtros aplicados. Tente ajustar os critérios de busca."
                icon={Filter}
              />
            )}
          </div>
        </InfoCard>

        {/* Coluna de Atividades */}
        <InfoCard 
          title={`Atividades (${filteredActivities.length})`} 
          icon={CheckSquare}
        >
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            ) : activities.length === 0 ? (
              <EmptyState
                title="Nenhuma atividade cadastrada"
                description="Crie a primeira atividade para começar a organizar as tarefas do projeto."
                icon={CheckSquare}
                action={{
                  label: "Criar Primeira Atividade",
                  onClick: onNewActivity
                }}
              />
            ) : (
              <EmptyState
                title="Nenhuma atividade encontrada"
                description="Nenhuma atividade corresponde aos filtros aplicados. Tente ajustar os critérios de busca."
                icon={Filter}
              />
            )}
          </div>
        </InfoCard>
      </div>
    </div>
  )
}

export default DeliverablesTab