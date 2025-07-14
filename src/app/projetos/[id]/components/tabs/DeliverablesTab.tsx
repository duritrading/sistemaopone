// src/app/projetos/[id]/components/tabs/DeliverablesTab.tsx - PROGRESS BAR FIXED
'use client'

import { useMemo, useState } from 'react'
import { 
  Target, 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Edit3, 
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle 
} from 'lucide-react'
import { InfoCard, EmptyState, StatusBadge, ProgressBar } from '../shared'
import { Milestone, Activity, TeamMember } from '../../types/project.types'
import { ProjectUtils } from '../../utils/ProjectUtils'

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
}

export default function DeliverablesTab({
  milestones,
  activities,
  teamMembers,
  onNewMilestone,
  onNewActivity,
  onEditMilestone,
  onEditActivity,
  onDeleteMilestone,
  onDeleteActivity
}: DeliverablesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all')

  // Helper function para formatar data
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Sem prazo'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  // Filtros aplicados
  const { filteredMilestones, filteredActivities } = useMemo(() => {
    const filterItems = <T extends Milestone | Activity>(items: T[]) => {
      return items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter
        const responsibleId = (item as any).assigned_to || (item as any).responsible_id
        const matchesResponsible = responsibleFilter === 'all' || responsibleId === responsibleFilter
        
        return matchesSearch && matchesStatus && matchesResponsible
      })
    }

    return {
      filteredMilestones: filterItems(milestones),
      filteredActivities: filterItems(activities)
    }
  }, [milestones, activities, searchTerm, statusFilter, responsibleFilter])

  // Verificar se tem filtros ativos
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || responsibleFilter !== 'all'

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setResponsibleFilter('all')
  }

  // === MILESTONE CARD ===
  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const isOverdue = ProjectUtils.isOverdue(milestone.due_date || milestone.deadline, milestone.status)
    const daysUntilDue = ProjectUtils.getDaysUntilDue(milestone.due_date || milestone.deadline)

    return (
      <div className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
        isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
              <StatusBadge status={milestone.status} type="milestone" />
            </div>
            
            {milestone.description && (
              <p className="text-sm text-gray-900 mb-3 leading-relaxed">
                {milestone.description}
              </p>
            )}

            {/* Progress Bar - FIXED: className -> color */}
            <div className="mb-3">
              <ProgressBar
                value={milestone.progress_percentage || 0}
                color={isOverdue && milestone.progress_percentage !== 100 ? "bg-red-600" : "bg-green-600"}
                showLabel={true}
              />
            </div>

            {/* Info Row */}
            <div className="flex flex-col space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-900 mr-2" />
                <div>
                  <span className="text-gray-700 font-medium">Prazo:</span>
                  <p className={`${isOverdue && milestone.status !== 'completed' ? 
                    'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {formatDate(milestone.due_date || milestone.deadline)}
                    {daysUntilDue !== null && (
                      <span className={`ml-2 text-xs ${daysUntilDue < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} dias atrasado` : 
                           daysUntilDue === 0 ? 'Vence hoje' : `${daysUntilDue} dias restantes`})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {milestone.responsible && (
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-900 mr-2" />
                  <span className="text-gray-700 font-medium">Responsável:</span>
                  <span className="ml-1 text-gray-900">{milestone.responsible.full_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => onEditMilestone(milestone)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Editar Marco"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteMilestone(milestone.id, milestone.title)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Excluir Marco"
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
        isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900">{activity.title}</h3>
              <StatusBadge status={activity.status} type="activity" />
            </div>
            
            {activity.description && (
              <p className="text-sm text-gray-900 mb-3 leading-relaxed">
                {activity.description}
              </p>
            )}

            {/* Activity Type Badge */}
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {ProjectUtils.getTypeIcon(activity.type || activity.category || '')} {ProjectUtils.translateType(activity.type || activity.category || '')}
              </span>
            </div>

            {/* Info Row */}
            <div className="flex flex-col space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-900 mr-2" />
                <div>
                  <span className="text-gray-700 font-medium">Prazo:</span>
                  <p className={`${isOverdue && !['completed', 'approved', 'delivered'].includes(activity.status) ? 
                    'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {formatDate(activity.due_date || activity.deadline)}
                    {daysUntilDue !== null && (
                      <span className={`ml-2 text-xs ${daysUntilDue < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} dias atrasado` : 
                           daysUntilDue === 0 ? 'Vence hoje' : `${daysUntilDue} dias restantes`})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {activity.responsible && (
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-900 mr-2" />
                  <span className="text-gray-700 font-medium">Responsável:</span>
                  <span className="ml-1 text-gray-900">{activity.responsible.full_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => onEditActivity(activity)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Editar Atividade"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteActivity(activity.id, activity.title)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Excluir Atividade"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onNewMilestone}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Marco
          </button>
          <button
            onClick={onNewActivity}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="review">Em Revisão</option>
              <option value="completed">Concluído</option>
              <option value="delayed">Atrasado</option>
            </select>
          </div>

          {/* Responsible Filter */}
          <div className="sm:w-48">
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">Todos os responsáveis</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Milestones Section */}
      <InfoCard title="Marcos do Projeto" icon={Target}>
        {filteredMilestones.length > 0 ? (
          <div className="space-y-4">
            {filteredMilestones.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="Nenhum marco encontrado"
            description={hasActiveFilters ? 
              "Nenhum marco corresponde aos filtros aplicados." : 
              "Nenhum marco foi criado ainda. Crie o primeiro marco do projeto."
            }
            action={!hasActiveFilters ? {
              label: "Criar Primeiro Marco",
              onClick: onNewMilestone
            } : undefined}
          />
        )}
      </InfoCard>

      {/* Activities Section */}
      <InfoCard title="Atividades do Projeto" icon={CheckSquare}>
        {filteredActivities.length > 0 ? (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckSquare}
            title="Nenhuma atividade encontrada"
            description={hasActiveFilters ? 
              "Nenhuma atividade corresponde aos filtros aplicados." : 
              "Nenhuma atividade foi criada ainda. Crie a primeira atividade do projeto."
            }
            action={!hasActiveFilters ? {
              label: "Criar Primeira Atividade",
              onClick: onNewActivity
            } : undefined}
          />
        )}
      </InfoCard>
    </div>
  )
}