// src/app/projetos/[id]/page.tsx - CÓDIGO COMPLETO CORRIGIDO
'use client'

import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  BarChart3, 
  Target, 
  Calendar, 
  MessageSquare,
  DollarSign,
  Clock
} from 'lucide-react'
import { 
  LoadingSpinner, 
  ErrorDisplay, 
  StatusBadge,
  CardSkeleton,
  KPICard,
  formatCurrencyCompact
} from './components/shared'
import { 
  NewMilestoneModal, 
  NewActivityModal, 
  EditItemModal 
} from './components/modals'
import { 
  ProjectDetails, 
  Milestone, 
  Activity, 
  TabId, 
  ModalState,
  MilestoneFormData,
  ActivityFormData
} from './types/project.types'
import { useProjectData } from './hooks/useProjectData'
import { MilestoneHandlers, ActivityHandlers } from './handlers/ProjectHandlers'
import { supabase } from '@/lib/supabase'

// === LAZY LOADED TABS ===
const OverviewTab = lazy(() => import('./components/tabs/OverviewTab'))
const DeliverablesTab = lazy(() => import('./components/tabs/DeliverablesTab'))
const TimelineTab = lazy(() => import('./components/tabs/TimelineTab'))
const CommunicationTab = lazy(() => import('./components/tabs/CommunicationTab'))

// === MODAL EDITAR PROJETO ===
interface EditProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: ProjectDetails
  onSubmit: (data: any) => void
}

const EditProjectModal = ({ isOpen, onClose, project, onSubmit }: EditProjectModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    project_type: 'MVP',
    status: 'Planejamento',
    health: 'Bom',
    risk_level: 'Médio',
    start_date: '',
    estimated_end_date: '',
    progress_percentage: 0,
    total_budget: 0,
    used_budget: 0,
    next_milestone: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        project_type: project.project_type || 'MVP',
        status: project.status || 'Planejamento',
        health: project.health || 'Bom',
        risk_level: project.risk_level || 'Médio',
        start_date: project.start_date || '',
        estimated_end_date: project.estimated_end_date || '',
        progress_percentage: project.progress_percentage || 0,
        total_budget: project.total_budget || 0,
        used_budget: project.used_budget || 0,
        next_milestone: project.next_milestone || '',
        description: project.description || ''
      })
    }
  }, [project, isOpen])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Nome do projeto é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
      alert('Erro ao salvar alterações')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Projeto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Projeto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome do projeto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Projeto
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MVP">MVP</option>
                <option value="Produto">Produto</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Interno">Interno</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Planejamento">Planejamento</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Em Revisão">Em Revisão</option>
                <option value="Concluído">Concluído</option>
                <option value="Pausado">Pausado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Status
              </label>
              <select
                value={formData.health}
                onChange={(e) => setFormData(prev => ({ ...prev, health: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Excelente">Excelente</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Crítico">Crítico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previsão de Término
              </label>
              <input
                type="date"
                value={formData.estimated_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Total
              </label>
              <input
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData(prev => ({ ...prev, total_budget: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Utilizado
              </label>
              <input
                type="number"
                value={formData.used_budget}
                onChange={(e) => setFormData(prev => ({ ...prev, used_budget: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Próximo Marco
            </label>
            <input
              type="text"
              value={formData.next_milestone}
              onChange={(e) => setFormData(prev => ({ ...prev, next_milestone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva o próximo marco importante"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descrição detalhada do projeto"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// === TAB SKELETON ===
const TabSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
)

// === KPI SKELETON ===
const KPISkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-gray-200 w-12 h-12" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// === COMPONENTE PRINCIPAL ===
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  // === ESTADOS DE UI ===
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [mounted, setMounted] = useState(false)
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false)
  const [modals, setModals] = useState<ModalState>({
    isNewMilestoneModalOpen: false,
    isNewActivityModalOpen: false,
    editingItem: null
  })

  // === DADOS DO PROJETO ===
  const {
    project,
    milestones,
    activities,
    teamMembers,
    kpis,
    loading,
    error,
    refetchAll,
    updateProject,
    addMilestone,
    updateMilestone,
    removeMilestone,
    addActivity,
    updateActivity,
    removeActivity
  } = useProjectData(projectId)

  // === EFFECTS ===
  useEffect(() => {
    setMounted(true)
  }, [])

  // === HELPER FUNCTIONS ===
  const getTrendDirection = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'up'
    if (value >= threshold.warning) return 'neutral'
    return 'down'
  }

  // === HANDLERS DE MODAL ===
  const openModal = (modalType: keyof ModalState, value: any = true) => {
    setModals(prev => ({ ...prev, [modalType]: value }))
  }

  const closeModal = (modalType: keyof ModalState) => {
    setModals(prev => ({ 
      ...prev, 
      [modalType]: modalType === 'editingItem' ? null : false 
    }))
  }

  // === HANDLERS DE PROJETO ===
  const handleEditProject = () => {
    setIsEditProjectModalOpen(true)
  }

  const handleUpdateProject = async (formData: any) => {
    const { data, error } = await supabase
      .from('projects')
      .update(formData)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar projeto:', error)
      throw error
    }

    if (data) {
      updateProject(data)
      alert('Projeto atualizado com sucesso!')
    }
  }

  // === HANDLERS DE MILESTONE ===
  const handleNewMilestone = async (formData: MilestoneFormData) => {
    const result = await MilestoneHandlers.create(projectId, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      addMilestone(result.data)
      closeModal('isNewMilestoneModalOpen')
      alert('Marco criado com sucesso!')
    }
  }

  const handleEditMilestone = (milestone: Milestone) => {
    const milestoneWithType = { ...milestone, type: 'marco' as const }
    openModal('editingItem', milestoneWithType)
  }

  const handleUpdateMilestone = async (formData: any) => {
    if (!modals.editingItem) return

    const result = await MilestoneHandlers.update(modals.editingItem.id, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      updateMilestone(modals.editingItem.id, result.data)
      closeModal('editingItem')
      alert('Marco atualizado com sucesso!')
    }
  }

  const handleDeleteMilestone = async (milestoneId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o marco "${title}"?`)) return

    const result = await MilestoneHandlers.delete(milestoneId)
    
    if (result.error) {
      alert(result.error)
      return
    }

    removeMilestone(milestoneId)
    alert('Marco excluído com sucesso!')
  }

  // === HANDLERS DE ACTIVITY ===
  const handleNewActivity = async (formData: ActivityFormData) => {
    const result = await ActivityHandlers.create(projectId, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      addActivity(result.data)
      closeModal('isNewActivityModalOpen')
      alert('Atividade criada com sucesso!')
    }
  }

  const handleEditActivity = (activity: Activity) => {
    const activityWithType = { ...activity, type: 'atividade' as const }
    openModal('editingItem', activityWithType)
  }

  const handleUpdateActivity = async (formData: any) => {
    if (!modals.editingItem) return

    const result = await ActivityHandlers.update(modals.editingItem.id, formData)
    
    if (result.error) {
      alert(result.error)
      return
    }

    if (result.data) {
      updateActivity(modals.editingItem.id, result.data)
      closeModal('editingItem')
      alert('Atividade atualizada com sucesso!')
    }
  }

  const handleDeleteActivity = async (activityId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir a atividade "${title}"?`)) return

    const result = await ActivityHandlers.delete(activityId)
    
    if (result.error) {
      alert(result.error)
      return
    }

    removeActivity(activityId)
    alert('Atividade excluída com sucesso!')
  }

  // === HANDLERS UNIFICADOS PARA MODAL DE EDIÇÃO ===
  const handleUpdateItem = async (formData: any) => {
    if (!modals.editingItem) return

    if (modals.editingItem.type === 'marco') {
      await handleUpdateMilestone(formData)
    } else {
      await handleUpdateActivity(formData)
    }
  }

  // === CONFIGURAÇÃO DAS TABS ===
  const tabs = useMemo(() => {
    if (!project) return []
    
    return [
      { 
        id: 'overview' as TabId, 
        label: 'Visão Geral', 
        icon: BarChart3,
        component: OverviewTab,
        props: { project, kpis }
      },
      { 
        id: 'deliverables' as TabId, 
        label: 'Marcos e Entregáveis', 
        icon: Target,
        component: DeliverablesTab,
        props: {
          milestones,
          activities,
          teamMembers,
          onNewMilestone: () => openModal('isNewMilestoneModalOpen'),
          onNewActivity: () => openModal('isNewActivityModalOpen'),
          onEditMilestone: handleEditMilestone,
          onEditActivity: handleEditActivity,
          onDeleteMilestone: handleDeleteMilestone,
          onDeleteActivity: handleDeleteActivity
        }
      },
      { 
        id: 'timeline' as TabId, 
        label: 'Cronograma', 
        icon: Calendar,
        component: TimelineTab,
        props: { milestones, activities }
      },
      { 
        id: 'communication' as TabId, 
        label: 'Comunicação', 
        icon: MessageSquare,
        component: CommunicationTab,
        props: { 
          projectId, 
          teamMembers
        }
      }
    ]
  }, [project, kpis, milestones, activities, teamMembers, projectId])

  // === RENDERS ===
  if (!mounted) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={refetchAll}
      />
    )
  }

  if (loading && !project) {
    return <LoadingSpinner />
  }

  if (!project) {
    return (
      <ErrorDisplay 
        error="Projeto não encontrado" 
        onRetry={() => router.push('/projetos')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header do Projeto */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/projetos')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <StatusBadge status={project.status} />
                  <span className="text-sm text-gray-600">
                    {project.project_type}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleEditProject}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Projeto</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs Estáticos */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <KPISkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Progresso Geral"
                value={`${kpis.overallProgress}%`}
                icon={Target}
                subtitle={`${kpis.completedMilestones} marcos concluídos`}
                trend={getTrendDirection(kpis.overallProgress, { good: 75, warning: 50 })}
                colorClass="bg-blue-500"
              />
              
              <KPICard
                title="Orçamento"
                value={formatCurrencyCompact(project.used_budget)}
                icon={DollarSign}
                subtitle={`de ${formatCurrencyCompact(project.total_budget)}`}
                trend={getTrendDirection(
                  ((project.total_budget - project.used_budget) / project.total_budget) * 100,
                  { good: 50, warning: 20 }
                )}
                colorClass="bg-green-500"
              />
              
            <KPICard
  title="Entregas Pendentes"
  value={kpis.totalMilestones + kpis.totalActivities - kpis.completedMilestones - kpis.completedActivities}
  icon={Clock}
  subtitle="marcos e atividades"
  trend={(kpis.totalMilestones + kpis.totalActivities - kpis.completedMilestones - kpis.completedActivities) <= 3 ? 'up' : 'neutral'}
  colorClass="bg-purple-500"
/>
              <KPICard
                title="Dias Restantes"
                value={kpis.daysRemaining}
                icon={Clock}
                subtitle="até o prazo final"
                trend={getTrendDirection(kpis.daysRemaining, { good: 30, warning: 7 })}
                colorClass={kpis.daysRemaining > 30 ? 'bg-green-500' : kpis.daysRemaining > 7 ? 'bg-yellow-500' : 'bg-red-500'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="max-w-7xl mx-auto p-6">
  {tabs.map(tab => {
    if (tab.id !== activeTab) return null
    
    const TabComponent = tab.component as any // Type assertion para resolver inference

    return (
      <Suspense key={tab.id} fallback={<TabSkeleton />}>
        <TabComponent 
          {...tab.props}
          loading={loading}
        />
      </Suspense>
    )
  })}
</div>

      {/* Modais */}
      <NewMilestoneModal
        isOpen={modals.isNewMilestoneModalOpen}
        onClose={() => closeModal('isNewMilestoneModalOpen')}
        onSubmit={handleNewMilestone}
        teamMembers={teamMembers}
      />

      <NewActivityModal
        isOpen={modals.isNewActivityModalOpen}
        onClose={() => closeModal('isNewActivityModalOpen')}
        onSubmit={handleNewActivity}
        teamMembers={teamMembers}
      />

      <EditItemModal
        isOpen={!!modals.editingItem}
        onClose={() => closeModal('editingItem')}
        onSubmit={handleUpdateItem}
        item={modals.editingItem}
        teamMembers={teamMembers}
      />

      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={project}
        onSubmit={handleUpdateProject}
      />
    </div>
  )
}