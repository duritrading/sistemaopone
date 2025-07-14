// src/app/projetos/[id]/page.tsx - UPDATED com KPIs estáticos e edição
'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Nome do projeto é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Projeto</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Digite o nome do projeto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => handleInputChange('project_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="MVP">MVP</option>
                    <option value="PoC">PoC</option>
                    <option value="Implementação">Implementação</option>
                    <option value="Consultoria">Consultoria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Planejamento">Planejamento</option>
                    <option value="Executando">Executando</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saúde</label>
                  <select
                    value={formData.health}
                    onChange={(e) => handleInputChange('health', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Bom">Bom</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risco</label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => handleInputChange('risk_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Marco</label>
                <input
                  type="text"
                  value={formData.next_milestone}
                  onChange={(e) => handleInputChange('next_milestone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: Deploy em produção"
                />
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cronograma e Orçamento</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Término</label>
                  <input
                    type="date"
                    value={formData.estimated_end_date}
                    onChange={(e) => handleInputChange('estimated_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progresso (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_percentage}
                  onChange={(e) => handleInputChange('progress_percentage', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ex: 65"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_budget}
                    onChange={(e) => handleInputChange('total_budget', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ex: 150000.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Usado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.used_budget}
                    onChange={(e) => handleInputChange('used_budget', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ex: 97500.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição/Objetivo</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Descreva o objetivo principal do projeto..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
    setModals(prev => ({ ...prev, [modalType]: modalType === 'editingItem' ? null : false }))
  }

  // === HANDLER EDITAR PROJETO ===
  const handleEditProject = () => {
    setIsEditProjectModalOpen(true)
  }

  const handleUpdateProject = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          project_type: formData.project_type,
          status: formData.status,
          health: formData.health,
          risk_level: formData.risk_level,
          start_date: formData.start_date || null,
          estimated_end_date: formData.estimated_end_date || null,
          progress_percentage: formData.progress_percentage,
          total_budget: formData.total_budget,
          used_budget: formData.used_budget,
          next_milestone: formData.next_milestone || null,
          description: formData.description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (error) throw error

      // Atualizar estado local
      updateProject(formData)
      setIsEditProjectModalOpen(false)
      alert('Projeto atualizado com sucesso!')

    } catch (err: any) {
      console.error('Erro ao atualizar projeto:', err)
      alert('Erro ao atualizar projeto: ' + err.message)
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

// Agora project é garantidamente não-null
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
              value={kpis.pendingDeliverables}
              icon={Clock}
              subtitle="marcos e atividades"
              trend={kpis.pendingDeliverables <= 3 ? 'up' : 'neutral'}
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
        
        const TabComponent = tab.component

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