// src/app/projetos/[id]/components/tabs/DeliverablesTab.tsx - IMPORT FIX
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
import { ProjectUtils } from '../../utils/ProjectUtils' // Fixed import path

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

            {/* Progress Bar */}
            <div className="mb-3">
              <ProgressBar
                value={milestone.progress_percentage || 0}
                className={isOverdue && milestone.progress_percentage !== 100 ? "bg-red-600" : "bg-green-600"}
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
          
          {/* Action Buttons */}
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
          
          {/* Action Buttons */}
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

  return (
    <div className="space-y-6">
      {/* Header com Filtros e Ações */}
      <div className="bg-white rounded-lg border p-6">
        {/* Controles de Filtro */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
          {/* Busca */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar marcos e atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluído</option>
            </select>

            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">Todos os responsáveis</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>{member.full_name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-gray-800 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Action Buttons */}
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

        {/* Filter Indicators */}
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

      {/* Milestones and Activities Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Milestones Column */}
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

        {/* Activities Column */}
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